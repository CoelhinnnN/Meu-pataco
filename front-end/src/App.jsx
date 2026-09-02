import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, Target,
  X, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line
} from "recharts";

/* ---------------------------------------------------------------
   Livro-Caixa — controle financeiro pessoal
   Paleta: verde ledger #1B3A2F, papel envelhecido #EDE6D3,
   tinta vermelha #A13D2E (débito), latão #A9822F (crédito)
   Tipografia: Fraunces (display), IBM Plex Mono (números), Inter (UI)
----------------------------------------------------------------*/

const COLORS = {
  ledgerGreen: "#1B3A2F",
  ledgerGreenDark: "#12271F",
  paper: "#EDE6D3",
  paperLine: "#D9CFB4",
  ink: "#2B2820",
  inkSoft: "#5C5647",
  red: "#A13D2E",
  redSoft: "#F1DCD5",
  gold: "#A9822F",
  goldSoft: "#F2E7CC",
};

const CATEGORIES = [
  { id: "moradia", label: "Moradia", color: "#6B7F6E" },
  { id: "alimentacao", label: "Alimentação", color: "#A13D2E" },
  { id: "transporte", label: "Transporte", color: "#3E6E8E" },
  { id: "lazer", label: "Lazer", color: "#A9822F" },
  { id: "saude", label: "Saúde", color: "#7A4E8C" },
  { id: "educacao", label: "Educação", color: "#4E7A6E" },
  { id: "salario", label: "Salário", color: "#1B3A2F" },
  { id: "freelance", label: "Freelance", color: "#5C7A3E" },
  { id: "investimentos", label: "Investimentos", color: "#8C6B4E" },
  { id: "outros", label: "Outros", color: "#8A8371" },
];

const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const GASTO_CATEGORIES = ["moradia", "alimentacao", "transporte", "lazer", "saude", "educacao", "outros"];
const GANHO_CATEGORIES = ["salario", "freelance", "investimentos", "outros"];

const todayISO = () => new Date().toISOString().slice(0, 10);

const monthKey = (dateStr) => dateStr.slice(0, 7); // YYYY-MM
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
};

const fmtBRL = (n) =>
  (n < 0 ? "-" : "") +
  "R$ " +
  Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const seedTransactions = () => {
  const now = new Date();
  const mk = (offsetDay) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offsetDay);
    return d.toISOString().slice(0, 10);
  };
  return [
    { id: "s1", type: "ganho", amount: 4200, description: "Salário", category: "salario", date: mk(3) },
    { id: "s2", type: "gasto", amount: 1350, description: "Aluguel", category: "moradia", date: mk(2) },
    { id: "s3", type: "gasto", amount: 480, description: "Supermercado", category: "alimentacao", date: mk(5) },
    { id: "s4", type: "gasto", amount: 120, description: "Uber da semana", category: "transporte", date: mk(1) },
    { id: "s5", type: "ganho", amount: 650, description: "Freela design", category: "freelance", date: mk(10) },
    { id: "s6", type: "gasto", amount: 89, description: "Cinema", category: "lazer", date: mk(8) },
    { id: "s7", type: "gasto", amount: 310, description: "Farmácia", category: "saude", date: mk(35) },
    { id: "s8", type: "ganho", amount: 4200, description: "Salário", category: "salario", date: mk(33) },
    { id: "s9", type: "gasto", amount: 1350, description: "Aluguel", category: "moradia", date: mk(32) },
    { id: "s10", type: "gasto", amount: 210, description: "Restaurantes", category: "alimentacao", date: mk(28) },
  ];
};

const defaultGoals = () => ({
  savingsGoal: 800,
  categoryLimits: { alimentacao: 700, lazer: 200, transporte: 250 },
});

export default function ControleFinanceiro() {
  const [loaded, setLoaded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState(defaultGoals());
  const [selectedMonth, setSelectedMonth] = useState(monthKey(todayISO()));
  const [showForm, setShowForm] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const [form, setForm] = useState({
    type: "gasto",
    amount: "",
    description: "",
    category: "alimentacao",
    date: todayISO(),
  });

  // fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // load persisted data (localStorage do navegador)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("livro-caixa-data");
      if (raw) {
        const parsed = JSON.parse(raw);
        setTransactions(parsed.transactions || seedTransactions());
        setGoals(parsed.goals || defaultGoals());
      } else {
        setTransactions(seedTransactions());
      }
    } catch (e) {
      setTransactions(seedTransactions());
    } finally {
      setLoaded(true);
    }
  }, []);

  // persist on change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("livro-caixa-data", JSON.stringify({ transactions, goals }));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }, [transactions, goals, loaded]);

  const addTransaction = useCallback(() => {
    const amount = parseFloat(String(form.amount).replace(",", "."));
    if (!form.description.trim() || !amount || amount <= 0) return;
    const t = {
      id: Date.now().toString(),
      type: form.type,
      amount,
      description: form.description.trim(),
      category: form.category,
      date: form.date,
    };
    setTransactions((prev) => [t, ...prev]);
    setForm({
      type: form.type,
      amount: "",
      description: "",
      category: form.type === "gasto" ? "alimentacao" : "salario",
      date: form.date,
    });
    setShowForm(false);
  }, [form]);

  const removeTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // months available for navigation (always include current + those with data)
  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    set.add(monthKey(todayISO()));
    return Array.from(set).sort();
  }, [transactions]);

  const shiftMonth = (dir) => {
    const idx = availableMonths.indexOf(selectedMonth);
    let newIdx = idx + dir;
    if (newIdx < 0) newIdx = 0;
    if (newIdx >= availableMonths.length) {
      // allow moving forward past known data into a fresh future month
      const [y, m] = selectedMonth.split("-").map(Number);
      const d = new Date(y, m - 1 + dir, 1);
      setSelectedMonth(d.toISOString().slice(0, 7));
      return;
    }
    setSelectedMonth(availableMonths[newIdx]);
  };

  const monthTx = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === selectedMonth)
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions, selectedMonth]
  );

  const totals = useMemo(() => {
    const ganhos = monthTx.filter((t) => t.type === "ganho").reduce((s, t) => s + t.amount, 0);
    const gastos = monthTx.filter((t) => t.type === "gasto").reduce((s, t) => s + t.amount, 0);
    return { ganhos, gastos, saldo: ganhos - gastos };
  }, [monthTx]);

  const saldoPorCategoria = useMemo(() => {
    const map = {};
    monthTx
      .filter((t) => t.type === "gasto")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([id, value]) => ({ id, value, cat: catById(id) }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const monthlyChartData = useMemo(() => {
    const months = [];
    const base = new Date(selectedMonth + "-01T00:00:00");
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    return months.map((key) => {
      const tx = transactions.filter((t) => monthKey(t.date) === key);
      const ganhos = tx.filter((t) => t.type === "ganho").reduce((s, t) => s + t.amount, 0);
      const gastos = tx.filter((t) => t.type === "gasto").reduce((s, t) => s + t.amount, 0);
      return { key, mes: monthLabel(key), Ganhos: ganhos, Gastos: gastos, Saldo: ganhos - gastos };
    });
  }, [transactions, selectedMonth]);

  const maxCatSpend = Math.max(1, ...saldoPorCategoria.map((c) => c.value));

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: COLORS.paper,
        color: COLORS.ink,
        minHeight: "100%",
        width: "100%",
      }}
    >
      {!loaded ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, gap: 10, color: COLORS.inkSoft }}>
          <Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} />
          <span>Abrindo o livro-caixa…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 0 48px" }}>
          <Header
            selectedMonth={selectedMonth}
            onShift={shiftMonth}
            totals={totals}
            onAdd={() => setShowForm(true)}
          />

          {saveError && (
            <div style={{ margin: "0 24px", padding: "8px 14px", background: COLORS.redSoft, color: COLORS.red, borderRadius: 4, fontSize: 13 }}>
              Não foi possível salvar automaticamente. Seus lançamentos ficam válidos nesta sessão.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, padding: "24px" }}>
            <LedgerList transactions={monthTx} onRemove={removeTransaction} onAdd={() => setShowForm(true)} />

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <MonthlyChart data={monthlyChartData} />
              <CategoryBreakdown data={saldoPorCategoria} max={maxCatSpend} totalGastos={totals.gastos} />
              <Goals
                goals={goals}
                setGoals={setGoals}
                saldo={totals.saldo}
                saldoPorCategoria={saldoPorCategoria}
                showEditor={showGoals}
                setShowEditor={setShowGoals}
              />
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <TransactionModal
          form={form}
          setForm={setForm}
          onClose={() => setShowForm(false)}
          onSave={addTransaction}
        />
      )}
    </div>
  );
}

function Header({ selectedMonth, onShift, totals, onAdd }) {
  return (
    <div
      style={{
        background: COLORS.ledgerGreen,
        color: COLORS.paper,
        padding: "28px 24px 22px",
        borderBottom: `3px double ${COLORS.gold}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.goldSoft, marginBottom: 4 }}>
            Livro-Caixa
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 30, margin: 0 }}>
            Controle financeiro
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => onShift(-1)}
            aria-label="Mês anterior"
            style={navBtnStyle}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, minWidth: 92, textAlign: "center", textTransform: "capitalize" }}>
            {monthLabel(selectedMonth)}
          </div>
          <button
            onClick={() => onShift(1)}
            aria-label="Próximo mês"
            style={navBtnStyle}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={onAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: COLORS.gold,
              color: COLORS.ledgerGreenDark,
              border: "none",
              borderRadius: 3,
              padding: "9px 16px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              marginLeft: 6,
            }}
          >
            <Plus size={15} /> Novo lançamento
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
        <StatCard icon={<TrendingUp size={16} />} label="Ganhos" value={totals.ganhos} tone="gold" />
        <StatCard icon={<TrendingDown size={16} />} label="Gastos" value={totals.gastos} tone="red" />
        <StatCard icon={<Wallet size={16} />} label="Saldo do mês" value={totals.saldo} tone={totals.saldo >= 0 ? "gold" : "red"} emphasized />
      </div>
    </div>
  );
}

const navBtnStyle = {
  background: "rgba(255,255,255,0.08)",
  border: `1px solid rgba(255,255,255,0.2)`,
  color: COLORS.paper,
  borderRadius: 3,
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

function StatCard({ icon, label, value, tone, emphasized }) {
  const toneColor = tone === "gold" ? COLORS.gold : COLORS.red;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: `1px solid rgba(255,255,255,0.12)`,
        borderRadius: 4,
        padding: "12px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(237,230,211,0.7)", fontSize: 12, marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: emphasized ? 24 : 20,
          fontWeight: 600,
          color: emphasized ? toneColor : COLORS.paper,
        }}
      >
        {fmtBRL(value)}
      </div>
    </div>
  );
}

function LedgerList({ transactions, onRemove, onAdd }) {
  return (
    <div
      style={{
        background: "#F7F3E8",
        border: `1px solid ${COLORS.paperLine}`,
        borderRadius: 4,
        padding: "4px 0 8px",
      }}
    >
      <div style={{ padding: "16px 20px 10px", borderBottom: `1px solid ${COLORS.paperLine}` }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 500, margin: 0 }}>
          Lançamentos do mês
        </h2>
      </div>

      {transactions.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: COLORS.inkSoft }}>
          <p style={{ margin: "0 0 12px", fontSize: 14 }}>Nenhum lançamento neste mês ainda.</p>
          <button onClick={onAdd} style={{ background: "none", border: `1px solid ${COLORS.inkSoft}`, borderRadius: 3, padding: "8px 14px", fontSize: 13, cursor: "pointer", color: COLORS.ink }}>
            Adicionar lançamento
          </button>
        </div>
      ) : (
        <div>
          {transactions.map((t, i) => {
            const cat = catById(t.category);
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: i < transactions.length - 1 ? `1px solid ${COLORS.paperLine}` : "none",
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.inkSoft, width: 46, flexShrink: 0 }}>
                  {t.date.slice(8, 10)}/{t.date.slice(5, 7)}
                </div>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.description}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{cat.label}</div>
                </div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    color: t.type === "ganho" ? "#5C7A3E" : COLORS.red,
                    flexShrink: 0,
                  }}
                >
                  {t.type === "ganho" ? "+" : "-"} {fmtBRL(t.amount)}
                </div>
                <button
                  onClick={() => onRemove(t.id)}
                  aria-label="Remover lançamento"
                  style={{ background: "none", border: "none", color: COLORS.inkSoft, cursor: "pointer", padding: 4, flexShrink: 0 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MonthlyChart({ data }) {
  return (
    <div style={panelStyle}>
      <h2 style={panelTitleStyle}>Ganhos x gastos — últimos 6 meses</h2>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={COLORS.paperLine} vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: COLORS.inkSoft, fontFamily: "Inter" }} axisLine={{ stroke: COLORS.paperLine }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: COLORS.inkSoft, fontFamily: "Inter" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
            <Tooltip
              formatter={(v) => fmtBRL(v)}
              contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 4, border: `1px solid ${COLORS.paperLine}` }}
            />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
            <Bar dataKey="Ganhos" fill={COLORS.gold} radius={[2, 2, 0, 0]} />
            <Bar dataKey="Gastos" fill={COLORS.red} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CategoryBreakdown({ data, max, totalGastos }) {
  return (
    <div style={panelStyle}>
      <h2 style={panelTitleStyle}>Gastos por categoria</h2>
      {data.length === 0 ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: 0 }}>Sem gastos registrados neste mês.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map((row) => (
            <div key={row.id}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{row.cat.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {fmtBRL(row.value)} <span style={{ color: COLORS.inkSoft }}>
                    ({totalGastos ? Math.round((row.value / totalGastos) * 100) : 0}%)
                  </span>
                </span>
              </div>
              <div style={{ height: 6, background: COLORS.paperLine, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(row.value / max) * 100}%`, background: row.cat.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Goals({ goals, setGoals, saldo, saldoPorCategoria, showEditor, setShowEditor }) {
  const [draft, setDraft] = useState(goals);

  useEffect(() => setDraft(goals), [showEditor]); // eslint-disable-line

  const gastoPorCat = (id) => (saldoPorCategoria.find((c) => c.id === id)?.value) || 0;
  const savingsPct = goals.savingsGoal > 0 ? Math.min(100, Math.max(0, (saldo / goals.savingsGoal) * 100)) : 0;

  const save = () => {
    setGoals({
      savingsGoal: parseFloat(draft.savingsGoal) || 0,
      categoryLimits: Object.fromEntries(
        Object.entries(draft.categoryLimits).map(([k, v]) => [k, parseFloat(v) || 0])
      ),
    });
    setShowEditor(false);
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ ...panelTitleStyle, margin: 0 }}>
          <Target size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Metas
        </h2>
        <button
          onClick={() => setShowEditor(!showEditor)}
          style={{ background: "none", border: "none", color: COLORS.inkSoft, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
        >
          {showEditor ? "Cancelar" : "Editar metas"}
        </button>
      </div>

      {!showEditor ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span>Meta de economia</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {fmtBRL(Math.max(saldo, 0))} / {fmtBRL(goals.savingsGoal)}
              </span>
            </div>
            <div style={{ height: 7, background: COLORS.paperLine, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${savingsPct}%`, background: saldo >= goals.savingsGoal ? "#5C7A3E" : COLORS.gold, borderRadius: 3 }} />
            </div>
          </div>

          {Object.keys(goals.categoryLimits).length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: 0 }}>Nenhum limite de categoria definido.</p>
          ) : (
            Object.entries(goals.categoryLimits).map(([catId, limit]) => {
              const spent = gastoPorCat(catId);
              const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
              const over = spent > limit;
              return (
                <div key={catId}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{catById(catId).label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: over ? COLORS.red : COLORS.ink }}>
                      {fmtBRL(spent)} / {fmtBRL(limit)}
                    </span>
                  </div>
                  <div style={{ height: 7, background: COLORS.paperLine, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: over ? COLORS.red : "#5C7A3E", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 12, color: COLORS.inkSoft }}>
            Meta de economia mensal
            <input
              type="number"
              value={draft.savingsGoal}
              onChange={(e) => setDraft({ ...draft, savingsGoal: e.target.value })}
              style={inputStyle}
            />
          </label>
          {GASTO_CATEGORIES.map((catId) => (
            <label key={catId} style={{ fontSize: 12, color: COLORS.inkSoft }}>
              Limite — {catById(catId).label}
              <input
                type="number"
                value={draft.categoryLimits[catId] ?? ""}
                placeholder="Sem limite"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    categoryLimits: { ...draft.categoryLimits, [catId]: e.target.value },
                  })
                }
                style={inputStyle}
              />
            </label>
          ))}
          <button
            onClick={save}
            style={{
              marginTop: 4,
              background: COLORS.ledgerGreen,
              color: COLORS.paper,
              border: "none",
              borderRadius: 3,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Salvar metas
          </button>
        </div>
      )}
    </div>
  );
}

function TransactionModal({ form, setForm, onClose, onSave }) {
  const categories = form.type === "gasto" ? GASTO_CATEGORIES : GANHO_CATEGORIES;
  const amountInvalid = form.amount !== "" && (isNaN(parseFloat(String(form.amount).replace(",", "."))) || parseFloat(String(form.amount).replace(",", ".")) <= 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27,58,47,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#F7F3E8",
          borderRadius: 6,
          padding: 24,
          width: 380,
          maxWidth: "100%",
          border: `1px solid ${COLORS.paperLine}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 500, margin: 0 }}>Novo lançamento</h2>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["gasto", "ganho"].map((type) => (
            <button
              key={type}
              onClick={() =>
                setForm({ ...form, type, category: type === "gasto" ? "alimentacao" : "salario" })
              }
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 4,
                border: `1px solid ${form.type === type ? (type === "gasto" ? COLORS.red : COLORS.gold) : COLORS.paperLine}`,
                background: form.type === type ? (type === "gasto" ? COLORS.redSoft : COLORS.goldSoft) : "transparent",
                color: form.type === type ? (type === "gasto" ? COLORS.red : "#8A6A1F") : COLORS.inkSoft,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <label style={labelStyle}>
          Descrição
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Ex: supermercado"
            style={inputStyle}
            autoFocus
          />
        </label>

        <label style={labelStyle}>
          Valor (R$)
          <input
            type="text"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0,00"
            style={{ ...inputStyle, borderColor: amountInvalid ? COLORS.red : COLORS.paperLine }}
          />
          {amountInvalid && <div style={{ color: COLORS.red, fontSize: 12, marginTop: 4 }}>Informe um valor válido.</div>}
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ ...labelStyle, flex: 1 }}>
            Categoria
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={inputStyle}
            >
              {categories.map((id) => (
                <option key={id} value={id}>
                  {catById(id).label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ ...labelStyle, flex: 1 }}>
            Data
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inputStyle}
            />
          </label>
        </div>

        <button
          onClick={onSave}
          disabled={!form.description.trim() || !form.amount}
          style={{
            width: "100%",
            marginTop: 8,
            background: !form.description.trim() || !form.amount ? COLORS.paperLine : COLORS.ledgerGreen,
            color: !form.description.trim() || !form.amount ? COLORS.inkSoft : COLORS.paper,
            border: "none",
            borderRadius: 4,
            padding: "11px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: !form.description.trim() || !form.amount ? "default" : "pointer",
          }}
        >
          Adicionar lançamento
        </button>
      </div>
    </div>
  );
}

const panelStyle = {
  background: "#F7F3E8",
  border: `1px solid ${COLORS.paperLine}`,
  borderRadius: 4,
  padding: "16px 18px 18px",
};

const panelTitleStyle = {
  fontFamily: "'Fraunces', serif",
  fontSize: 15,
  fontWeight: 500,
  margin: "0 0 14px",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: COLORS.inkSoft,
  marginBottom: 12,
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 5,
  padding: "9px 10px",
  fontSize: 14,
  fontFamily: "'IBM Plex Mono', monospace",
  border: `1px solid ${COLORS.paperLine}`,
  borderRadius: 4,
  background: "#fff",
  color: COLORS.ink,
  boxSizing: "border-box",
};
