(function () {
  const MAX_INSTALLMENTS = 11;
  const config = window.FINANCING_APP_CONFIG || {};
  const today = stripTime(new Date());
  const defaultValues = Object.assign(
    {
      companyName: "AVOVITE S.A.S.",
      companyNit: "901446849-9",
      advisorName: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      productName: "Vites",
      quantity: 1,
      unitPrice: 2580000,
      discountPct: 22,
      initialPayment: 2012400,
      installmentCount: 5,
      firstDueDate: toISODate(addMonths(today, 1)),
      notes:
        "Propuesta v\u00e1lida \u00fanicamente por el d\u00eda de hoy. Los valores quedan sujetos a confirmaci\u00f3n de pago y disponibilidad."
    },
    config.defaults || {}
  );

  const fieldNames = [
    "companyName",
    "companyNit",
    "advisorName",
    "clientName",
    "clientPhone",
    "clientEmail",
    "productName",
    "quantity",
    "unitPrice",
    "discountPct",
    "initialPayment",
    "installmentCount",
    "firstDueDate",
    "notes"
  ];

  const moneyFields = new Set(["unitPrice", "initialPayment"]);
  const coreAmountFields = new Set(["quantity", "unitPrice", "discountPct", "initialPayment"]);
  const els = {};
  const state = {
    logoUrl: config.logoUrl || "",
    payments: [],
    paymentsManual: false,
    lastResult: null
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    fieldNames.forEach((name) => {
      els[name] = document.querySelector(`[data-field="${name}"]`);
      if (els[name] && defaultValues[name] !== undefined) {
        els[name].value = defaultValues[name];
      }
    });

    applyTheme(config.primaryColor || "#1f6b34", config.accentColor || "#a75b2b");
    applyLogo(state.logoUrl);

    document.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("input", handleFieldChange);
      input.addEventListener("change", handleFieldChange);
      if (moneyFields.has(input.dataset.field)) {
        input.addEventListener("focus", () => {
          const value = Math.round(readNumber(input.dataset.field) || 0);
          input.value = value ? String(value) : "";
          input.select();
        });
        input.addEventListener("blur", () => {
          input.value = money(readNumber(input.dataset.field));
        });
      }
    });

    formatMoneyInputs();

    const editor = document.querySelector("[data-payment-editor]");
    if (editor) {
      editor.addEventListener("input", handlePaymentEdit);
      editor.addEventListener("change", handlePaymentEdit);
      editor.addEventListener("click", handlePaymentClick);
      editor.addEventListener("focusin", handlePaymentFocusIn);
      editor.addEventListener("focusout", handlePaymentFocusOut);
    }

    bindClick("[data-action='autoPayments']", () => {
      state.paymentsManual = false;
      autoFillPayments();
      render();
      renderStatus("Cuotas autorrellenadas.");
    });
    bindClick("[data-action='addPayment']", () => {
      addPayment();
      render();
    });
    bindClick("[data-action='downloadPdf']", downloadPDF);
    bindClick("[data-action='downloadImage']", downloadImage);
    bindClick("[data-action='reset']", resetForm);

    autoFillPayments();
    render();
  }

  function bindClick(selector, handler) {
    const node = document.querySelector(selector);
    if (node) node.addEventListener("click", handler);
  }

  function handleFieldChange(event) {
    const field = event.target.dataset.field;
    if (!field) return;

    if (field === "installmentCount" || field === "firstDueDate") {
      state.paymentsManual = false;
      autoFillPayments();
    } else if (coreAmountFields.has(field) && !state.paymentsManual) {
      autoFillPayments();
    }

    render();
  }

  function handlePaymentEdit(event) {
    const row = event.target.closest("[data-payment-index]");
    if (!row) return;
    const index = Number(row.dataset.paymentIndex);
    if (!Number.isInteger(index) || !state.payments[index]) return;

    if (event.target.matches("[data-payment-amount]")) {
      state.payments[index].amount = readLooseNumber(event.target.value);
      if (event.type === "change") {
        event.target.value = money(state.payments[index].amount);
      }
    }

    if (event.target.matches("[data-payment-date]")) {
      state.payments[index].date = event.target.value;
    }

    state.paymentsManual = true;
    render({ skipPaymentEditor: true });
  }

  function handlePaymentClick(event) {
    const removeButton = event.target.closest("[data-remove-payment]");
    if (!removeButton) return;
    const row = removeButton.closest("[data-payment-index]");
    const index = Number(row && row.dataset.paymentIndex);
    if (!Number.isInteger(index)) return;

    state.payments.splice(index, 1);
    state.paymentsManual = true;
    if (els.installmentCount) els.installmentCount.value = state.payments.length;
    render();
  }

  function resetForm() {
    fieldNames.forEach((name) => {
      if (els[name] && defaultValues[name] !== undefined) {
        els[name].value = defaultValues[name];
      }
    });
    state.paymentsManual = false;
    autoFillPayments();
    renderStatus("Valores base restaurados.");
    render();
    formatMoneyInputs();
  }

  function calculateBase() {
    const quantity = readNumber("quantity");
    const unitPrice = readNumber("unitPrice");
    const discountPct = readNumber("discountPct");
    const initialPayment = readNumber("initialPayment");
    const firstDueDate = parseISODate(readText("firstDueDate")) || addMonths(today, 1);
    const gross = quantity * unitPrice;
    const discountRate = discountPct / 100;
    const discountAmount = gross * discountRate;
    const net = gross - discountAmount;
    const discountedUnit = quantity > 0 ? net / quantity : 0;
    const balance = net - initialPayment;

    return {
      quantity,
      unitPrice,
      discountPct,
      discountRate,
      gross,
      discountAmount,
      net,
      discountedUnit,
      initialPayment,
      balance,
      firstDueDate
    };
  }

  function calculate() {
    const base = calculateBase();
    const schedule = base.balance > 0 ? sanitizePayments(state.payments) : [];
    const paymentSum = schedule.reduce((sum, item) => sum + item.amount, 0);
    const collectedTotal = base.initialPayment + paymentSum;
    const difference = Math.round(base.net) - Math.round(collectedTotal);

    const errors = [];
    if (!readText("clientName")) errors.push("El nombre del cliente es obligatorio.");
    if (base.quantity <= 0) errors.push("La cantidad de Vites debe ser mayor a cero.");
    if (base.unitPrice <= 0) errors.push("El valor unitario debe ser mayor a cero.");
    if (base.discountPct < 0 || base.discountPct > 100) errors.push("El descuento debe estar entre 0% y 100%.");
    if (base.initialPayment < 0) errors.push("El abono inicial no puede ser negativo.");
    if (base.initialPayment > base.net) errors.push("El abono inicial no puede superar el valor neto a pagar.");
    if (schedule.length > MAX_INSTALLMENTS) errors.push(`El m\u00e1ximo permitido es ${MAX_INSTALLMENTS} cuotas.`);
    if (base.balance > 0 && schedule.length < 1) errors.push("Si queda saldo financiado, agrega al menos 1 cuota.");
    if (base.balance > 0 && schedule.some((item) => item.amount <= 0)) {
      errors.push("Todas las cuotas deben tener un valor mayor a cero.");
    }
    if (base.balance > 0 && schedule.some((item) => !item.date)) {
      errors.push("Todas las cuotas deben tener fecha de pago.");
    }
    if (base.balance > 0 && Math.abs(difference) > 1) {
      const word = difference > 0 ? "faltan" : "sobran";
      errors.push(`La propuesta no cierra en $0: ${word} ${money(Math.abs(difference))}.`);
    }

    return Object.assign({}, base, {
      schedule,
      installmentCount: schedule.length,
      paymentSum,
      collectedTotal,
      difference,
      errors
    });
  }

  function render(options) {
    const result = calculate();
    state.lastResult = result;

    const values = {
      companyName: readText("companyName") || "AVOVITE S.A.S.",
      companyNit: readText("companyNit") || "901446849-9",
      advisorName: readText("advisorName") || "Asesora comercial",
      clientName: readText("clientName") || "Cliente",
      clientPhone: readText("clientPhone"),
      clientEmail: readText("clientEmail"),
      productName: readText("productName") || "Vites",
      todayLong: formatDate(today),
      todayShort: formatShortDate(today),
      validUntil: formatDate(today),
      validUntilCompact: formatCompactDate(today),
      quantity: formatNumber(result.quantity),
      unitPrice: money(result.unitPrice),
      gross: money(result.gross),
      discountPct: `${formatNumber(result.discountPct)}%`,
      discountAmount: money(result.discountAmount),
      net: money(result.net),
      discountedUnit: money(result.discountedUnit),
      initialPayment: money(result.initialPayment),
      balance: money(Math.max(result.balance, 0)),
      paymentSum: money(result.paymentSum),
      installmentCount: String(result.installmentCount),
      installmentLabel:
        result.balance <= 0
          ? "Pago de contado"
          : `${result.installmentCount} ${result.installmentCount === 1 ? "cuota" : "cuotas"}`,
      firstDueDate: result.schedule[0] ? formatDate(parseISODate(result.schedule[0].date)) : formatDate(result.firstDueDate),
      notes: readText("notes") || ""
    };

    setOutputs(values);
    renderClientContact(values);
    renderSchedule(result);
    if (!options || !options.skipPaymentEditor) renderPaymentEditor(result);
    renderBalanceCheck(result);
    renderErrors(result.errors);
  }

  function setOutputs(values) {
    document.querySelectorAll("[data-out]").forEach((node) => {
      const key = node.dataset.out;
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        node.textContent = values[key];
      }
    });
    document.title = `Plantilla de Simulacion Financiacion - ${values.clientName}`;
  }

  function renderClientContact(values) {
    const node = document.querySelector("[data-client-contact]");
    if (!node) return;
    const lines = [];
    if (values.clientPhone) lines.push(`Tel\u00e9fono: ${values.clientPhone}`);
    if (values.clientEmail) lines.push(`Correo: ${values.clientEmail}`);
    node.innerHTML = lines.map((line) => `<p>${escapeHTML(line)}</p>`).join("");
  }

  function renderSchedule(result) {
    const scheduleNode = document.querySelector("[data-schedule]");
    if (!scheduleNode) return;

    if (result.balance <= 0) {
      scheduleNode.innerHTML = `
        <div class="schedule-row">
          <strong>Pago total</strong>
          <span>${escapeHTML(formatCompactDate(today))}</span>
          <b>${money(result.net)}</b>
        </div>
      `;
      return;
    }

    scheduleNode.innerHTML = result.schedule
      .map(
        (item, index) => `
        <div class="schedule-row">
          <strong>Cuota ${index + 1}</strong>
          <span>${escapeHTML(formatCompactDate(parseISODate(item.date)))}</span>
          <b>${money(item.amount)}</b>
        </div>
      `
      )
      .join("");
  }

  function renderPaymentEditor(result) {
    const editor = document.querySelector("[data-payment-editor]");
    if (!editor) return;

    if (result.balance <= 0) {
      editor.innerHTML = `<div class="payment-editor-empty">No hay saldo financiado. El abono inicial cubre el valor neto.</div>`;
      return;
    }

    editor.innerHTML = state.payments
      .map(
        (item, index) => `
        <div class="payment-editor-row" data-payment-index="${index}">
          <div class="payment-editor-label">Cuota ${index + 1}</div>
          <label>
            <span>Valor</span>
            <input data-payment-amount type="text" inputmode="numeric" autocomplete="off" value="${money(item.amount || 0)}">
          </label>
          <label>
            <span>Fecha de pago</span>
            <input data-payment-date type="date" value="${escapeHTML(item.date || "")}">
          </label>
          <button class="icon-btn" type="button" data-remove-payment aria-label="Quitar cuota ${index + 1}">Quitar</button>
        </div>
      `
      )
      .join("");
  }

  function handlePaymentFocusIn(event) {
    if (!event.target.matches("[data-payment-amount]")) return;
    const value = Math.round(readLooseNumber(event.target.value) || 0);
    event.target.value = value ? String(value) : "";
    event.target.select();
  }

  function handlePaymentFocusOut(event) {
    if (!event.target.matches("[data-payment-amount]")) return;
    event.target.value = money(readLooseNumber(event.target.value));
  }

  function renderBalanceCheck(result) {
    const node = document.querySelector("[data-balance-check]");
    if (!node) return;

    if (Math.abs(result.difference) <= 1) {
      node.className = "balance-check ok";
      node.textContent = `Cierre en $0: abono inicial + cuotas = ${money(result.collectedTotal)}.`;
      return;
    }

    if (result.balance <= 0) {
      node.className = "balance-check warn";
      const word = result.difference > 0 ? "Falta recibir" : "Sobra";
      node.textContent = `${word} ${money(Math.abs(result.difference))}. Abono inicial: ${money(result.initialPayment)} / Neto: ${money(result.net)}.`;
      return;
    }

    node.className = "balance-check warn";
    const word = result.difference > 0 ? "Falta asignar" : "Sobra";
    node.textContent = `${word} ${money(Math.abs(result.difference))}. Neto: ${money(result.net)} | Abono: ${money(result.initialPayment)} | Cuotas: ${money(result.paymentSum)}.`;
  }

  function renderErrors(errors) {
    const panel = document.querySelector("[data-errors]");
    const buttons = document.querySelectorAll("[data-requires-valid]");
    const hasErrors = errors.length > 0;

    if (panel) {
      panel.classList.toggle("show", hasErrors);
      panel.textContent = hasErrors ? errors.join(" ") : "";
    }

    buttons.forEach((button) => {
      button.disabled = hasErrors;
    });
  }

  function autoFillPayments() {
    const base = calculateBase();
    let count = clamp(Math.floor(readNumber("installmentCount") || 0), 0, MAX_INSTALLMENTS);
    if (base.balance <= 0) count = 0;
    if (base.balance > 0 && count < 1) count = 1;
    if (els.installmentCount) els.installmentCount.value = count;

    const amounts = distributeAmount(Math.max(base.balance, 0), count);
    state.payments = amounts.map((amount, index) => ({
      amount,
      date: toISODate(addMonths(base.firstDueDate, index))
    }));
  }

  function addPayment() {
    if (state.payments.length >= MAX_INSTALLMENTS) {
      renderStatus(`M\u00e1ximo ${MAX_INSTALLMENTS} cuotas.`, true);
      return;
    }

    const base = calculateBase();
    const lastDate = state.payments.length
      ? parseISODate(state.payments[state.payments.length - 1].date)
      : base.firstDueDate;
    const currentSum = state.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    let remaining = Math.max(Math.round(base.balance) - Math.round(currentSum), 0);

    if (remaining === 0 && state.payments.length) {
      const lastPayment = state.payments[state.payments.length - 1];
      remaining = Math.floor(Number(lastPayment.amount || 0) / 2);
      lastPayment.amount = Math.max(Math.round(Number(lastPayment.amount || 0)) - remaining, 0);
    }

    state.payments.push({
      amount: remaining || 0,
      date: toISODate(addMonths(lastDate, state.payments.length ? 1 : 0))
    });
    state.paymentsManual = true;
    if (els.installmentCount) els.installmentCount.value = state.payments.length;
  }

  function sanitizePayments(payments) {
    return payments
      .slice(0, MAX_INSTALLMENTS)
      .map((item) => ({
        amount: Math.round(Number(item.amount) || 0),
        date: item.date || ""
      }));
  }

  function applyLogo(url) {
    const logoNodes = document.querySelectorAll("[data-logo]");
    logoNodes.forEach((node) => {
      if (url) {
        node.innerHTML = "";
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Logo Avovite";
        node.appendChild(img);
      } else {
        const company = readText("companyName") || defaultValues.companyName || "Empresa";
        node.innerHTML = `<div class="empty-logo">${escapeHTML(initials(company))}</div>`;
      }
    });
  }

  function applyTheme(primary, accent) {
    const root = document.documentElement;
    if (primary) {
      const rgb = hexToRgb(primary);
      root.style.setProperty("--brand-primary", primary);
      root.style.setProperty("--brand-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      root.style.setProperty("--brand-primary-dark", darkenHex(primary, 0.38));
      root.style.setProperty("--brand-secondary", lightenHex(primary, 0.26));
      root.style.setProperty("--brand-soft", lightenHex(primary, 0.9));
    }
    if (accent) {
      root.style.setProperty("--brand-accent", accent);
    }
  }

  async function downloadImage() {
    try {
      renderStatus("Generando imagen...");
      const canvas = await captureProposal();
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${fileBaseName()}.png`;
      link.click();
      renderStatus("Imagen generada.");
    } catch (error) {
      renderStatus(`No pude generar la imagen: ${String(error && error.message ? error.message : error)}`, true);
    }
  }

  async function downloadPDF() {
    try {
      renderStatus("Generando PDF...");
      const canvas = await captureProposal();
      const imgData = canvas.toDataURL("image/png");
      const jsPDF = window.jspdf && window.jspdf.jsPDF;
      if (!jsPDF) {
        window.print();
        renderStatus("No cargo la libreria PDF; abri el dialogo de impresion.");
        return;
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 22;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + margin;
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`${fileBaseName()}.pdf`);
      renderStatus("PDF generado.");
    } catch (error) {
      window.print();
      renderStatus(`No pude generar PDF directo: ${String(error && error.message ? error.message : error)}. Abri imprimir para guardar como PDF.`, true);
    }
  }

  async function captureProposal() {
    const node = document.getElementById("proposalDocument");
    if (!node || !window.html2canvas) {
      throw new Error("html2canvas no disponible");
    }

    return window.html2canvas(node, {
      scale: Math.min(2.4, window.devicePixelRatio || 2),
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollY: -window.scrollY
    });
  }

  function renderStatus(message, isError) {
    const status = document.querySelector("[data-status]");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("error", Boolean(isError));
  }

  function fileBaseName() {
    const company = readText("companyName") || "avovite";
    const client = readText("clientName") || "cliente";
    return slugify(`propuesta-${company}-${client}-${toISODate(today)}`);
  }

  function readText(name) {
    const node = els[name] || document.querySelector(`[data-field="${name}"]`);
    return node ? String(node.value || "").trim() : "";
  }

  function readNumber(name) {
    return readLooseNumber(readText(name));
  }

  function readLooseNumber(value) {
    const raw = String(value || "");
    if (!raw) return 0;
    let normalized = raw
      .replace(/\s/g, "")
      .replace(/\$/g, "")
      .replace(/[^\d.,-]/g, "");
    const dotCount = (normalized.match(/\./g) || []).length;
    const commaCount = (raw.match(/,/g) || []).length;
    if (commaCount > 0) {
      normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
    } else if (dotCount > 0 && looksLikeThousandsWithDots(normalized)) {
      normalized = normalized.replace(/\./g, "");
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function looksLikeThousandsWithDots(value) {
    const normalized = String(value || "").replace(/^-/, "");
    const parts = normalized.split(".");
    if (parts.length < 2) return false;
    return parts[0].length >= 1 &&
      parts[0].length <= 3 &&
      parts.slice(1).every((part) => /^\d{3}$/.test(part));
  }

  function distributeAmount(total, count) {
    const roundedTotal = Math.round(total);
    if (count <= 0) return [];
    const base = Math.floor(roundedTotal / count);
    const remainder = roundedTotal - base * count;
    return Array.from({ length: count }, (_, index) => base + (index === count - 1 ? remainder : 0));
  }

  function money(value) {
    const rounded = Math.round(Number(value) || 0);
    return `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(rounded)}`;
  }

  function formatMoneyInputs() {
    moneyFields.forEach((name) => {
      if (els[name]) els[name].value = money(readNumber(name));
    });
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(Number(value) || 0);
  }

  function formatDate(date) {
    if (!date || Number.isNaN(date.getTime())) return "Fecha pendiente";
    const text = new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function formatShortDate(date) {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function formatCompactDate(date) {
    if (!date || Number.isNaN(date.getTime())) return "Fecha pendiente";
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseISODate(value) {
    if (!value) return null;
    const parts = String(value).split("-").map(Number);
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  function addMonths(date, months) {
    const year = date.getFullYear();
    const month = date.getMonth() + months;
    const day = date.getDate();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function initials(text) {
    return String(text)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function rgbToHex(color) {
    return `#${[color.r, color.g, color.b]
      .map((part) => Math.max(0, Math.min(255, part)).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function hexToRgb(hex) {
    const clean = String(hex || "").replace("#", "");
    if (clean.length !== 6) return { r: 31, g: 107, b: 52 };
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }

  function darkenHex(hex, amount) {
    const color = hexToRgb(hex);
    return rgbToHex({
      r: Math.round(color.r * (1 - amount)),
      g: Math.round(color.g * (1 - amount)),
      b: Math.round(color.b * (1 - amount))
    });
  }

  function lightenHex(hex, amount) {
    const color = hexToRgb(hex);
    return rgbToHex({
      r: Math.round(color.r + (255 - color.r) * amount),
      g: Math.round(color.g + (255 - color.g) * amount),
      b: Math.round(color.b + (255 - color.b) * amount)
    });
  }
})();
