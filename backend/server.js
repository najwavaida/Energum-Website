require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const nodemailer = require("nodemailer");

const admin = require("firebase-admin");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.set("trust proxy", 1);

// ========================
// Firebase Admin init
// ========================
function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!path) {
    console.warn(
      "⚠️ FIREBASE_SERVICE_ACCOUNT_PATH belum di-set. Email order admin TIDAK akan bisa fetch order dari Firestore."
    );
    return;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(path, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized");
}
initFirebaseAdmin();

const fdb = admin.apps.length ? admin.firestore() : null;

// ========================
// Helpers
// ========================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COOLDOWN_MS = 2000;
const nextAllowedAtByIp = new Map();
let queue = Promise.resolve();

function enqueue(task) {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
}

async function waitCooldown(ip) {
  const now = Date.now();
  const next = nextAllowedAtByIp.get(ip) || 0;
  if (now < next) await sleep(next - now);
  nextAllowedAtByIp.set(ip, Date.now() + COOLDOWN_MS);
}

async function fetchGeminiWithBackoff(url, payload, maxAttempts = 6) {
  let last = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));
    last = { status: resp.status, data };

    if (resp.ok) return { ok: true, data };

    if (resp.status === 429) {
      const retryAfter = resp.headers.get("retry-after");
      const base = retryAfter ? Number(retryAfter) * 1000 : 1000 * 2 ** attempt;
      const jitter = Math.floor(Math.random() * 400);
      await sleep(Math.min(base + jitter, 15000));
      continue;
    }

    return { ok: false, status: resp.status, data };
  }

  return { ok: false, status: 429, data: last };
}

function formatPrice(n) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `Rp ${n}`;
  }
}

function statusLabel(s) {
  const map = {
    pending: "Menunggu konfirmasi",
    confirmed: "Dikonfirmasi",
    processing: "Diproses",
    shipped: "Dikirim",
    delivered: "Sampai",
    received: "Diterima pembeli",
    cancelled: "Dibatalkan",
  };
  return map[s] || s;
}

function nowTs() {
  return admin.firestore.Timestamp.fromDate(new Date());
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

// ========================
// Nodemailer
// ========================
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "⚠️ SMTP env belum lengkap. Email notifikasi admin tidak aktif."
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

const transporter = createTransporter();

async function sendAdminEmail({ subject, html, replyTo }) {
  if (!transporter) return false;

  const fromName = process.env.SMTP_FROM_NAME || "EnerGum";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("⚠️ ADMIN_EMAIL belum diisi.");
    return false;
  }

  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: adminEmail,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  return true;
}

// ========================
// Firestore Order Fetch & Update
// ========================
async function getOrderDocByOrderId(orderId) {
  if (!fdb) throw new Error("Firebase Admin belum siap");

  const snap = await fdb
    .collection("orders")
    .where("orderId", "==", orderId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
}

function buildAdminActionLinks(orderId, token) {
  const base = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
  const enc = encodeURIComponent;

  const make = (to) =>
    `${base}/api/admin/orders/${enc(orderId)}/status?to=${enc(to)}&token=${enc(
      token
    )}`;

  const cancel = `${base}/api/admin/orders/${enc(orderId)}/cancel?token=${enc(
    token
  )}`;

  return {
    confirmed: make("confirmed"),
    processing: make("processing"),
    shipped: make("shipped"),
    delivered: make("delivered"),
    cancel,
  };
}

function renderOrderHtml(order, actionLinks) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${
          it.productName
        }</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${
          it.quantity
        }</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(
          it.totalPrice
        )}</td>
      </tr>
    `
    )
    .join("");

  const addr = order.shippingAddress || {};
  const userEmail = order.userEmail || "-";

  const btn = (label, href) => `
    <a href="${href}" style="display:inline-block;margin:6px 8px 0 0;padding:10px 14px;border-radius:10px;
      background:#111827;color:#fff;text-decoration:none;font-weight:600;font-size:13px;">
      ${label}
    </a>
  `;

  const cancelBtn = (label, href) => `
    <a href="${href}" style="display:inline-block;margin:6px 8px 0 0;padding:10px 14px;border-radius:10px;
      background:#b91c1c;color:#fff;text-decoration:none;font-weight:600;font-size:13px;">
      ${label}
    </a>
  `;

  return `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
    <h2 style="margin:0 0 6px;">📦 Pesanan Baru EnerGum</h2>
    <p style="margin:0 0 14px;color:#374151;">
      Order ID: <b>${order.orderId}</b> • Status: <b>${statusLabel(
    order.status
  )}</b>
    </p>

    <div style="padding:12px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:14px;">
      <p style="margin:0 0 6px;"><b>Email Pembeli:</b> ${userEmail}</p>
      <p style="margin:0 0 6px;"><b>Nama:</b> ${addr.fullName || "-"}</p>
      <p style="margin:0 0 6px;"><b>Telepon:</b> ${addr.phone || "-"}</p>
      <p style="margin:0 0 6px;"><b>Alamat:</b> ${addr.address || "-"}, ${
    addr.city || "-"
  }, ${addr.postalCode || "-"}</p>
      ${
        addr.notes
          ? `<p style="margin:0;"><b>Catatan:</b> ${addr.notes}</p>`
          : ""
      }
    </div>

    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px;text-align:left;border-bottom:1px solid #eee;">Produk</th>
          <th style="padding:10px;text-align:center;border-bottom:1px solid #eee;">Qty</th>
          <th style="padding:10px;text-align:right;border-bottom:1px solid #eee;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows ||
          `<tr><td colspan="3" style="padding:10px;">(Tidak ada item)</td></tr>`
        }
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:10px;text-align:right;"><b>Total</b></td>
          <td style="padding:10px;text-align:right;"><b>${formatPrice(
            order.totalAmount
          )}</b></td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top:14px;padding:12px;border:1px dashed #e5e7eb;border-radius:12px;">
      <p style="margin:0 0 8px;color:#374151;"><b>Aksi Admin:</b></p>
      ${btn("✅ Konfirmasi", actionLinks.confirmed)}
      ${btn("⚙️ Proses", actionLinks.processing)}
      ${btn("🚚 Kirim", actionLinks.shipped)}
      ${btn("📍 Sampai", actionLinks.delivered)}
      ${cancelBtn("❌ Batalkan", actionLinks.cancel)}
      <p style="margin:10px 0 0;color:#6b7280;font-size:12px;">
        Tombol Konfirmasi.
      </p>
    </div>
  </div>
  `;
}

async function ensureAdminToken(orderRef, orderData) {
  const ttlHours = Number(process.env.ADMIN_TOKEN_TTL_HOURS || 168);
  const now = new Date();

  if (orderData.adminToken && orderData.adminTokenExpiresAt) {
    const exp = orderData.adminTokenExpiresAt.toDate
      ? orderData.adminTokenExpiresAt.toDate()
      : new Date(orderData.adminTokenExpiresAt);

    if (exp.getTime() > now.getTime()) {
      return { token: orderData.adminToken, expiresAt: exp };
    }
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = addHours(now, ttlHours);

  await orderRef.update({
    adminToken: token,
    adminTokenExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });

  return { token, expiresAt };
}

async function verifyAdminToken(orderData, token) {
  if (!orderData.adminToken || !orderData.adminTokenExpiresAt) return false;
  if (String(orderData.adminToken) !== String(token)) return false;

  const exp = orderData.adminTokenExpiresAt.toDate
    ? orderData.adminTokenExpiresAt.toDate()
    : new Date(orderData.adminTokenExpiresAt);

  return exp.getTime() > Date.now();
}

async function pushStatusHistory(orderRef, orderData, newStatus, message) {
  const history = Array.isArray(orderData.statusHistory)
    ? orderData.statusHistory
    : [];
  const now = new Date();

  await orderRef.update({
    status: newStatus,
    updatedAt: nowTs(),
    statusHistory: [
      ...history,
      {
        status: newStatus,
        timestamp: nowTs(),
        message: message || statusLabel(newStatus),
      },
    ],
  });
}

app.post("/api/support/notify-admin", async (req, res) => {
  try {
    const { roomId, text, userEmail } = req.body || {};
    if (!roomId || !text) {
      return res.status(400).json({ error: "roomId dan text wajib" });
    }

    const webBase = (process.env.WEB_BASE_URL || "").replace(/\/$/, "");
    const roomLink = webBase
      ? `${webBase}/admin/support/${encodeURIComponent(roomId)}`
      : "(WEB_BASE_URL belum diset)";

    const subject = `[SUPPORT] Pesan baru dari ${
      userEmail || "user"
    } (${roomId})`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <h2 style="margin:0 0 8px;">💬 Pesan Support Baru</h2>
        <p style="margin:0 0 10px;color:#374151;">
          Dari: <b>${userEmail || "-"}</b><br/>
          Room: <b>${roomId}</b>
        </p>
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;">
          <p style="margin:0;white-space:pre-wrap;color:#111827;">${String(text)
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</p>
        </div>
        <div style="margin-top:14px;">
          <a href="${roomLink}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;font-weight:600;font-size:13px;">
            Buka Chat Admin
          </a>
        </div>
        <p style="margin-top:12px;color:#6b7280;font-size:12px;">
          Set WEB_BASE_URL agar link mengarah ke web kamu.
        </p>
      </div>
    `;

    const ok = await sendAdminEmail({ subject, html, replyTo: userEmail });
    return res.json({ ok });
  } catch (e) {
    console.error("notify-admin error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

app.post("/api/recommend", async (req, res) => {
  try {
    const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

    const r = await fetch(`${ML_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({
        error: "ML service error",
        detail: data,
      });
    }

    return res.json(data);
  } catch (e) {
    return res.status(500).json({
      error: "Gagal menghubungi ML service. Pastikan FastAPI jalan di :8000",
      detail: String(e),
    });
  }
});

app.get("/api/recommend/health", async (_req, res) => {
  try {
    const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
    const r = await fetch(`${ML_URL}/health`);
    const data = await r.json().catch(() => ({}));
    return res.status(r.ok ? 200 : 500).json(data);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

// 3) ORDER EMAIL ADMIN

app.post("/api/orders/notify-admin", async (req, res) => {
  try {
    const { orderId, event = "created" } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "orderId wajib" });
    if (!fdb)
      return res.status(500).json({ error: "Firebase Admin belum siap" });

    const found = await getOrderDocByOrderId(orderId);
    if (!found) return res.status(404).json({ error: "Order tidak ditemukan" });

    const { ref, data } = found;

    // token supaya admin bisa klik tombol di email
    const { token } = await ensureAdminToken(ref, data);
    const links = buildAdminActionLinks(orderId, token);

    const subject =
      event === "cancelled"
        ? `[ORDER DIBATALKAN] ${orderId}`
        : `[ORDER BARU] ${orderId}`;

    const html = renderOrderHtml(data, links);

    // reply-to = email user supaya admin tinggal reply
    const ok = await sendAdminEmail({
      subject,
      html,
      replyTo: data.userEmail || undefined,
    });

    return res.json({ ok, orderId });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

// 4) ADMIN ACTION VIA EMAIL (klik tombol)

app.get("/api/admin/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { to, token } = req.query;

    if (!fdb) return res.status(500).send("Firebase Admin belum siap");
    if (!to || !token) return res.status(400).send("Missing to/token");

    const found = await getOrderDocByOrderId(orderId);
    if (!found) return res.status(404).send("Order tidak ditemukan");

    const { ref, data } = found;

    const valid = await verifyAdminToken(data, token);
    if (!valid) return res.status(401).send("Token admin invalid/expired");

    const allowed = new Set([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "received",
      "cancelled",
    ]);
    const newStatus = String(to);
    if (!allowed.has(newStatus))
      return res.status(400).send("Status tidak valid");

    await pushStatusHistory(
      ref,
      data,
      newStatus,
      `Update oleh admin: ${statusLabel(newStatus)}`
    );

    return res.send(`
      <div style="font-family:Arial;padding:24px;">
        <h3>✅ Status diupdate</h3>
        <p>Order <b>${orderId}</b> → <b>${statusLabel(newStatus)}</b></p>
        <p>Kamu bisa tutup tab ini.</p>
      </div>
    `);
  } catch (e) {
    return res.status(500).send(String(e));
  }
});

app.get("/api/admin/orders/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token } = req.query;

    if (!fdb) return res.status(500).send("Firebase Admin belum siap");
    if (!token) return res.status(400).send("Missing token");

    const found = await getOrderDocByOrderId(orderId);
    if (!found) return res.status(404).send("Order tidak ditemukan");

    const { ref, data } = found;

    const valid = await verifyAdminToken(data, token);
    if (!valid) return res.status(401).send("Token admin invalid/expired");

    await pushStatusHistory(
      ref,
      data,
      "cancelled",
      "Dibatalkan oleh admin via email"
    );

    return res.send(`
      <div style="font-family:Arial;padding:24px;">
        <h3>❌ Pesanan dibatalkan</h3>
        <p>Order <b>${orderId}</b> berhasil dibatalkan.</p>
        <p>Kamu bisa tutup tab ini.</p>
      </div>
    `);
  } catch (e) {
    return res.status(500).send(String(e));
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(
    `✅ Backend jalan di http://localhost:${process.env.PORT || 3001}`
  );
});
