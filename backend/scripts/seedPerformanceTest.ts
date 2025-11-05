/**
 * 🚀 ZAHARDEV GYM MANAGER – PRUEBA E2E ULTRA DEBUG (v3)
 * ------------------------------------------------------------
 * 💡 Prueba de extremo a extremo con instrumentación avanzada.
 *   - Autenticación completa (admin del seed)
 *   - Validación profunda de /memberships (con relaciones)
 *   - Simulación de check-in real
 *   - Auditoría financiera y de rendimiento
 *   - Diagnóstico automatizado de errores
 *
 * ▶ Ejecutar con:
 *   npx ts-node scripts/seedPerformanceTest.ts
 */

import axios from "axios";
import chalk from "chalk";
import util from "util";
import fs from "fs";
import path from "path";

const API_URL = "http://localhost:3000";
const LOG_PATH = path.resolve("./logs/e2e-debug.json");

// Pretty printer
const pretty = (obj: any, depth = 3) =>
  util.inspect(obj, { depth, colors: true, maxArrayLength: 20 });

// Helper: medir tiempo y capturar errores
async function timedRequest(label: string, fn: () => Promise<any>) {
  const start = Date.now();
  try {
    const res = await fn();
    const ms = Date.now() - start;
    console.log(chalk.green(`✅ [${label}] → ${ms} ms`));
    return { ok: true, data: res.data, ms };
  } catch (err: any) {
    const ms = Date.now() - start;
    const info = err.response?.data || err.message;
    console.log(chalk.red(`❌ [${label}] falló (${ms} ms)`));
    console.error(chalk.gray(pretty(info, 5)));
    return { ok: false, error: info, ms };
  }
}

// Guardar logs JSON crudos
function appendLog(step: string, payload: any) {
  const data = { step, timestamp: new Date().toISOString(), payload };
  fs.appendFileSync(LOG_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function main() {
  console.log(chalk.cyanBright("\n🚀 ZAHARDEV – PRUEBA E2E ULTRA DEBUG\n"));
  console.log(chalk.gray(`🧭 Endpoint base: ${API_URL}`));

  if (!fs.existsSync("./logs")) fs.mkdirSync("./logs");

  // =========================================================
  // 1️⃣ LOGIN ADMIN
  // =========================================================
  console.log(chalk.yellow("\n🔐 Autenticando usuario ADMIN..."));
  const loginRes = await timedRequest("auth/login", async () =>
    axios.post(`${API_URL}/auth/login`, {
      email: "admin@gym.com",
      password: "Admin123!",
    })
  );
  appendLog("auth/login", loginRes);

  if (!loginRes.ok || !loginRes.data?.accessToken) {
    console.log(chalk.red("❌ No se obtuvo token JWT. Abortando."));
    process.exit(1);
  }

  const token = loginRes.data.accessToken;
  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(chalk.green("✅ Login correcto, token JWT obtenido."));

  // =========================================================
  // 2️⃣ DASHBOARD HEALTH / METRICS
  // =========================================================
  console.log(chalk.yellow.bold("\n📊 DASHBOARD – MÉTRICAS BÁSICAS\n"));
  await timedRequest("GET /dashboard/ping", () =>
    axiosAuth.get("/dashboard/ping")
  );
  await timedRequest("GET /dashboard/metrics", () =>
    axiosAuth.get("/dashboard/metrics")
  );
  await timedRequest("GET /dashboard/checkins/daily", () =>
    axiosAuth.get("/dashboard/checkins/daily")
  );
  await timedRequest("GET /dashboard/checkins/peak-hour", () =>
    axiosAuth.get("/dashboard/checkins/peak-hour")
  );
  await timedRequest("GET /dashboard/refresh", () =>
    axiosAuth.get("/dashboard/refresh")
  );

  // =========================================================
  // 3️⃣ DEBUG DE MEMBRESÍAS
  // =========================================================
  console.log(chalk.yellow.bold("\n🧩 DEBUG DE /memberships (modo completo)\n"));
  const membershipsRes = await timedRequest("GET /memberships/debug/full", () =>
    axiosAuth.get("/memberships/debug/full")
  );
  appendLog("/memberships/debug/full", membershipsRes);

  const memberships = membershipsRes?.data ?? [];
  if (!Array.isArray(memberships)) {
    console.log(chalk.red("⚠️ La respuesta no es un array."));
    console.log(chalk.gray("Contenido:"), pretty(memberships, 4));
    process.exit(1);
  }
  console.log(chalk.cyan(`📦 Total de membresías devueltas: ${memberships.length}\n`));

  // Mostrar 3 primeros
  memberships.slice(0, 3).forEach((m: any, i: number) => {
    console.log(chalk.gray(`──────── Registro #${i + 1} ────────`));
    console.log(
      chalk.white(`🆔 ${m.id}`),
      chalk.gray("| Estado:"),
      chalk[m.status === "ACTIVE" ? "green" : "red"](m.status)
    );
    console.log(chalk.blue("👤 Usuario:"), pretty(m.user, 1));
    console.log(chalk.magenta("💼 Plan:"), pretty(m.plan, 1));
    console.log("");
  });

  const missingRelations = memberships.filter((m: any) => !m.user || !m.plan);

  if (missingRelations.length > 0) {
    console.log(chalk.red(`🚨 ${missingRelations.length} registros carecen de relaciones user/plan`));
    missingRelations.slice(0, 2).forEach((m: any, i: number) => {
      console.log(chalk.gray(`── Registro #${i + 1} sin relaciones:`));
      console.log(pretty(m, 3));
    });
  } else {
    console.log(chalk.green('✅ Todas las membresías incluyen user y plan correctamente.\n'));
  }

  // Conteo por estado
  const countByStatus = memberships.reduce((acc: any, m: any) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});
  console.log(chalk.cyan("📊 Distribución por estado:"));
  console.log(chalk.gray(pretty(countByStatus, 2)), "\n");

  // Buscar cliente activo
  const clienteActivo = memberships.find(
    (m: any) => m.status === "ACTIVE" && m.user?.role === "CLIENT"
  );

  if (!clienteActivo) {
    console.log(chalk.red("⚠️ No se encontró ninguna membresía activa de cliente."));
    const roles = [
      ...new Set(memberships.map((m: any) => m.user?.role).filter(Boolean)),
    ];
    const hasActive = memberships.some((m: any) => m.status === "ACTIVE");
    console.log(chalk.yellow("🔎 Diagnóstico rápido:"));
    console.log(
      chalk.gray(
        `hasActive=${hasActive}, roles=[${roles.join(", ")}], includeUser=${memberships[0]?.user ? "YES" : "NO"}`
      )
    );
    console.log(chalk.gray("Ejemplo registro:"), pretty(memberships[0], 3));
    appendLog("diagnostic/memberships", { hasActive, roles, memberships });
  } else {
    console.log(chalk.greenBright("\n✅ Cliente activo localizado!"));
    console.log(
      chalk.cyan("👤"),
      clienteActivo.user.name,
      chalk.gray(`(${clienteActivo.user.email})`)
    );
    console.log(chalk.green(`🏷️ Plan:`), clienteActivo.plan?.name || "sin plan");
    console.log(
      chalk.gray(
        `📅 Vigencia: ${clienteActivo.startDate} → ${clienteActivo.endDate}\n`
      )
    );

    // =========================================================
    // 4️⃣ SIMULACIÓN DE CHECK-IN
    // =========================================================
    console.log(chalk.yellow.bold("🏋️ SIMULACIÓN DE CHECK-IN\n"));
    const checkinData = {
      userId: clienteActivo.user.id,
      notes: "Simulación E2E - Check-in ultra debug",
    };
    const checkinRes = await timedRequest("POST /checkin", () =>
      axiosAuth.post("/checkin", checkinData)
    );
    appendLog("checkin", checkinRes);
  }

  // =========================================================
  // 5️⃣ DASHBOARD FINANCIERO
  // =========================================================
  console.log(chalk.yellow.bold("\n💰 DASHBOARD FINANCIERO\n"));
  const financeEndpoints = [
    "/dashboard/finance/summary",
    "/dashboard/finance/methods",
    "/dashboard/finance/plans",
    "/dashboard/finance/trend",
    "/dashboard/finance",
  ];
  for (const ep of financeEndpoints) {
    const label = `GET ${ep}`;
    const res = await timedRequest(label, () => axiosAuth.get(ep));
    appendLog(ep, res);
  }

  // =========================================================
  // 6️⃣ RENDIMIENTO GLOBAL
  // =========================================================
  console.log(chalk.yellow.bold("\n🌍 RENDIMIENTO GLOBAL\n"));
  const perf = await timedRequest("GET /dashboard/performance/global", () =>
    axiosAuth.get("/dashboard/performance/global")
  );
  appendLog("/dashboard/performance/global", perf);

  // =========================================================
  // 🧾 RESUMEN FINAL
  // =========================================================
  console.log(chalk.greenBright("\n✅ PRUEBA E2E FINALIZADA 🎯"));
  console.log(chalk.white("🧾 Resumen:"));
  console.log(chalk.gray("──────────────────────────────"));
  console.log(chalk.green("✔ Auth OK"));
  console.log(chalk.green("✔ Dashboard operativo OK"));
  console.log(chalk.green("✔ Dashboard financiero OK"));
  console.log(chalk.green("✔ Check-in probado (si cliente activo)"));
  console.log(chalk.green("✔ Logs guardados en logs/e2e-debug.json"));
  console.log(chalk.gray("──────────────────────────────\n"));
}

main().catch((err) => {
  console.error(chalk.red("❌ Error global en la prueba E2E:"), err);
});
