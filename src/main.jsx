import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, ArrowDownUp, WalletCards, PieChart, Target, ListTodo, Repeat,
  BarChart3, Settings, Plus, Search, ShieldCheck, LogOut, Trash2, Check, X,
  CreditCard, CircleDollarSign, LockKeyhole, Download, Upload, UserRound,
  TrendingUp, TrendingDown, ChevronRight, AlertCircle
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import './styles.css';

const DEMO_EMAIL = 'demo@money.local';
const DEMO_PASSWORD = '123456';
const LOCAL_KEY = 'money-manager-demo-v3';
const categories = ['Food','Travel','Education','Shopping','Bills','Subscription','Salary','Health','Other'];
const accountTypes = ['Bank','Cash','UPI','Credit Card','Investment'];

const seed = {
  profile: { name: 'Personal User', currency: 'INR' },
  accounts: [
    { id:'a1', name:'Main Bank', type:'Bank', opening_balance:42500 },
    { id:'a2', name:'Cash', type:'Cash', opening_balance:3500 },
    { id:'a3', name:'UPI Wallet', type:'UPI', opening_balance:8200 }
  ],
  transactions: [
    { id:'t1', title:'Groceries', category:'Food', amount:850, type:'expense', transaction_date:'2026-09-05', account_id:'a1', note:'Weekly groceries' },
    { id:'t2', title:'Uber', category:'Travel', amount:320, type:'expense', transaction_date:'2026-09-04', account_id:'a3', note:'' },
    { id:'t3', title:'College fee', category:'Education', amount:5000, type:'expense', transaction_date:'2026-09-02', account_id:'a1', note:'Part payment' },
    { id:'t4', title:'iCloud', category:'Subscription', amount:99, type:'expense', transaction_date:'2026-09-01', account_id:'a1', note:'' },
    { id:'t5', title:'Monthly income', category:'Salary', amount:30000, type:'income', transaction_date:'2026-09-01', account_id:'a1', note:'' }
  ],
  budgets: [
    {id:'b1',category:'Food',amount:4000},{id:'b2',category:'Travel',amount:3000},{id:'b3',category:'Education',amount:7000},
    {id:'b4',category:'Shopping',amount:2000},{id:'b5',category:'Bills',amount:3000},{id:'b6',category:'Other',amount:1000}
  ],
  goals: [
    {id:'g1',name:'Emergency fund',target_amount:100000,saved_amount:35000,target_date:'2027-03-31'},
    {id:'g2',name:'New MacBook',target_amount:120000,saved_amount:42000,target_date:'2027-08-31'}
  ],
  tasks: [
    {id:'k1',title:'College fee',amount:25000,due_date:'2026-09-10',category:'Education',done:false,create_expense_on_complete:true},
    {id:'k2',title:'Internet bill',amount:899,due_date:'2026-09-12',category:'Bills',done:false,create_expense_on_complete:true},
    {id:'k3',title:'Review September budget',amount:0,due_date:'2026-09-15',category:'Planning',done:false,create_expense_on_complete:false}
  ],
  subscriptions: [
    {id:'s1',name:'iCloud',amount:99,cycle:'Monthly',next_date:'2026-09-20',category:'Subscription'},
    {id:'s2',name:'ChatGPT',amount:1999,cycle:'Monthly',next_date:'2026-09-24',category:'Software'}
  ]
};

const nav = [
  ['Dashboard', LayoutDashboard],['Transactions', ArrowDownUp],['Accounts', WalletCards],['Budget', PieChart],
  ['Goals', Target],['Tasks', ListTodo],['Subscriptions', Repeat],['Reports', BarChart3],['Settings', Settings]
];

const clone = value => JSON.parse(JSON.stringify(value));
const uid = () => crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now();
const today = () => new Date().toISOString().slice(0,10);
const monthKey = (d=today()) => d.slice(0,7);
const formatDate = d => d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0);
const safeNumber = n => Number.isFinite(Number(n)) ? Number(n) : 0;

function localLoad(){ try{return JSON.parse(localStorage.getItem(LOCAL_KEY)) || clone(seed);}catch{return clone(seed);} }
function localSave(data){localStorage.setItem(LOCAL_KEY,JSON.stringify(data));}

function App(){
  const [session,setSession] = useState(null);
  const [loading,setLoading] = useState(true);
  const [data,setData] = useState(null);
  const [tab,setTab] = useState('Dashboard');
  const [search,setSearch] = useState('');
  const [showAdd,setShowAdd] = useState(false);
  const [toast,setToast] = useState('');
  const [error,setError] = useState('');

  useEffect(()=>{
    let active=true;
    if(!isSupabaseConfigured){
      const email=localStorage.getItem('mm-demo-session');
      if(active){setSession(email?{email, demo:true}:null);setData(email?localLoad():null);setLoading(false);}
      return;
    }
    supabase.auth.getSession().then(({data:{session}})=>{if(!active)return;setSession(session);setLoading(false);if(session)loadCloud(session.user.id);}).catch(e=>{if(!active)return;setError(e.message||'Unable to restore session.');setLoading(false);});
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);if(next)loadCloud(next.user.id);else setData(null);});
    return ()=>{active=false;listener.subscription.unsubscribe();};
  },[]);

  async function loadCloud(userId){
    setLoading(true);setError('');
    try{
      const tables=['profiles','accounts','transactions','budgets','goals','tasks','subscriptions'];
      const results=await Promise.all(tables.map(t=>supabase.from(t).select('*')));
      const bad=results.find(r=>r.error);
      if(bad)throw bad.error;
      const [profiles,accounts,transactions,budgets,goals,tasks,subscriptions]=results.map(r=>r.data||[]);
      const profile=profiles[0]||{id:userId,display_name:'Personal User',currency:'INR'};
      setData({profile:{name:profile.display_name,currency:profile.currency},accounts,transactions,budgets,goals,tasks,subscriptions});
    }catch(e){setError(e.message||'Unable to load workspace.');setData(null)}finally{setLoading(false)}
  }

  useEffect(()=>{if(data && !isSupabaseConfigured)localSave(data);},[data]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),2500);return()=>clearTimeout(t);}},[toast]);

  if(loading)return <div className="loading-screen"><div className="brand-mark">M</div><b>Loading your private workspace…</b></div>;
  if(!session)return <Login onLogin={nextSession=>{setSession(nextSession);if(!isSupabaseConfigured)setData(localLoad())}} />;
  if(!data)return <div className="loading-screen"><AlertCircle size={22}/><span>{error||'Unable to load workspace.'}</span></div>;

  const commitData = async (updater) => {
    setData(current => {
      const next = typeof updater === 'function' ? updater(clone(current)) : updater;
      if (isSupabaseConfigured) persistCloud(next).catch(e => setToast(e.message || 'Cloud sync failed'));
      return next;
    });
  };
  const persistCloud = async next => {
    const userId = session.user.id;
    const tables = {
      accounts: next.accounts.map(x => ({id:x.id,name:x.name,type:x.type,opening_balance:safeNumber(x.opening_balance),user_id:userId})),
      transactions: next.transactions.map(x => ({id:x.id,title:x.title,category:x.category,amount:safeNumber(x.amount),type:x.type,transaction_date:x.transaction_date,account_id:x.account_id||null,note:x.note||null,task_id:x.task_id||null,user_id:userId})),
      budgets: next.budgets.map(x => ({id:x.id,category:x.category,month:x.month||`${monthKey()}-01`,amount:safeNumber(x.amount),user_id:userId})),
      goals: next.goals.map(x => ({id:x.id,name:x.name,target_amount:safeNumber(x.target_amount),saved_amount:safeNumber(x.saved_amount),target_date:x.target_date||null,user_id:userId})),
      tasks: next.tasks.map(x => ({id:x.id,title:x.title,amount:safeNumber(x.amount),due_date:x.due_date,category:x.category||'Planning',done:Boolean(x.done),create_expense_on_complete:Boolean(x.create_expense_on_complete),user_id:userId})),
      subscriptions: next.subscriptions.map(x => ({id:x.id,name:x.name,amount:safeNumber(x.amount),cycle:x.cycle,next_date:x.next_date,category:x.category||'Subscription',user_id:userId}))
    };
    const profile={id:userId,display_name:next.profile.name||'Personal User',currency:next.profile.currency||'INR'};
    const r0=await supabase.from('profiles').upsert(profile); if(r0.error)throw r0.error;
    for(const [table,rows] of Object.entries(tables)){
      const existing=await supabase.from(table).select('id'); if(existing.error)throw existing.error;
      const keep=new Set(rows.map(r=>r.id));
      const remove=(existing.data||[]).map(r=>r.id).filter(id=>!keep.has(id));
      if(remove.length){const r=await supabase.from(table).delete().in('id',remove);if(r.error)throw r.error;}
      if(rows.length){const r=await supabase.from(table).upsert(rows);if(r.error)throw r.error;}
    }
  };
  const addTransaction = async tx => {
    if(!isSupabaseConfigured){commitData(d=>({...d,transactions:[{...tx,id:uid()},...d.transactions]}));setShowAdd(false);setToast('Transaction added');return;}
    const payload={user_id:session.user.id,title:tx.title,category:tx.category,amount:tx.amount,type:tx.type,transaction_date:tx.transaction_date,account_id:tx.account_id||null,note:tx.note||null};
    const {data:row,error:e}=await supabase.from('transactions').insert(payload).select().single();
    if(e){setToast(e.message);return;} setData(d=>({...d,transactions:[row,...d.transactions]}));setShowAdd(false);setToast('Transaction added');
  };
  const removeTransaction = async id => {
    if(!confirm('Delete this transaction?'))return;
    if(isSupabaseConfigured){const {error:e}=await supabase.from('transactions').delete().eq('id',id);if(e){setToast(e.message);return;}}
    commitData(d=>({...d,transactions:d.transactions.filter(x=>x.id!==id)}));setToast('Transaction deleted');
  };
  const signOut=async()=>{if(isSupabaseConfigured)await supabase.auth.signOut();else localStorage.removeItem('mm-demo-session');setSession(null);setData(null);};
  const exportData=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`money-manager-${monthKey()}.json`;a.click();URL.revokeObjectURL(a.href);};
  const importData=file=>{if(!file)return;const reader=new FileReader();reader.onload=async e=>{try{const next=JSON.parse(e.target.result);if(!next.profile||!Array.isArray(next.transactions)||!Array.isArray(next.accounts)||!Array.isArray(next.budgets)||!Array.isArray(next.goals)||!Array.isArray(next.tasks)||!Array.isArray(next.subscriptions))throw Error();if(isSupabaseConfigured){await persistCloud(next);}setData(next);setToast(isSupabaseConfigured?'Backup restored to cloud':'Local backup imported');}catch(err){setToast(err?.message||'Invalid backup file');}};reader.readAsText(file);};

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">M</span><span>Money<span className="thin">Manager</span></span></div>
      <div className="profile-chip"><div className="avatar">{(data.profile.name||'P')[0].toUpperCase()}</div><div><b>{data.profile.name}</b><small>{session.user?.email||session.email}</small></div></div>
      <nav>{nav.map(([name,Icon])=><button key={name} className={`nav-item ${tab===name?'active':''}`} onClick={()=>setTab(name)}><Icon size={18}/><span>{name}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="security-note"><ShieldCheck size={17}/><span>{isSupabaseConfigured?'Cloud-secured workspace':'Local demo workspace'}<small>{isSupabaseConfigured?'RLS protected':'Not for real financial data'}</small></span></div><button className="nav-item" onClick={signOut}><LogOut size={18}/><span>Sign out</span></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">M</span>MoneyManager</div><div className="title-area"><span className="eyebrow">{new Date().toLocaleString('en-IN',{month:'long',year:'numeric'}).toUpperCase()}</span><h1>{tab}</h1></div><div className="top-actions"><div className="searchbox"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" /></div><button className="primary" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add transaction</button></div></header>
      <div className="page">
        {tab==='Dashboard'&&<Dashboard data={data} setTab={setTab}/>} {tab==='Transactions'&&<Transactions data={data} search={search} onAdd={()=>setShowAdd(true)} onDelete={removeTransaction}/>} {tab==='Accounts'&&<Accounts data={data} setData={commitData}/>} {tab==='Budget'&&<Budget data={data} setData={commitData}/>} {tab==='Goals'&&<Goals data={data} setData={commitData}/>} {tab==='Tasks'&&<Tasks data={data} setData={commitData}/>} {tab==='Subscriptions'&&<Subscriptions data={data} setData={commitData}/>} {tab==='Reports'&&<Reports data={data}/>} {tab==='Settings'&&<SettingsPage data={data} setData={commitData} exportData={exportData} importData={importData} cloud={isSupabaseConfigured}/>} 
      </div>
    </main>
    {showAdd&&<AddTransaction accounts={data.accounts} onClose={()=>setShowAdd(false)} onSave={addTransaction}/>} {toast&&<div className="toast"><Check size={15}/>{toast}</div>}
  </div>;
}

function Login({onLogin}){
  const [mode,setMode]=useState('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const submit=async e=>{e.preventDefault();setError('');setBusy(true);
    try{
      if(!isSupabaseConfigured){if(mode==='login'){if(email!==DEMO_EMAIL||password!==DEMO_PASSWORD)throw Error(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);localStorage.setItem('mm-demo-session',email);onLogin({email,demo:true});}else{if(password.length<6)throw Error('Password must be at least 6 characters.');localStorage.setItem('mm-demo-session',email);const d=localLoad();d.profile.name=name.trim()||'Personal User';localSave(d);onLogin({email,demo:true});}return;}
      if(mode==='login'){const {data,error:e}=await supabase.auth.signInWithPassword({email,password});if(e)throw e;onLogin(data.session);} else {const {data,error:e}=await supabase.auth.signUp({email,password,options:{data:{display_name:name.trim()||'Personal User'}}});if(e)throw e;if(!data.session)setError('Account created. Check your email to confirm, then sign in.');else onLogin(data.session);}
    }catch(e){setError(e.message||'Authentication failed.')}finally{setBusy(false)}
  };
  return <div className="login-screen"><div className="login-wrap"><div className="login-brand"><span className="brand-mark">M</span><b>Money<span>Manager</span></b></div><div className="login-card"><div className="lock"><LockKeyhole size={19}/></div><h1>{mode==='login'?'Welcome back':'Create your account'}</h1><p>{isSupabaseConfigured?'Your financial workspace is protected by managed authentication and database authorization.':'This is a local UI demo. Configure Supabase before using real financial data.'}</p><form onSubmit={submit}>{mode==='signup'&&<label>Display name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}<label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 6 characters"/></label>{error&&<div className="error">{error}</div>}<button disabled={busy} className="primary full">{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</button></form>{!isSupabaseConfigured&&<div className="demo-box"><b>Demo account</b><span>{DEMO_EMAIL}</span><span>{DEMO_PASSWORD}</span></div>}<div className="login-switch">{mode==='login'?<>New here? <button onClick={()=>setMode('signup')}>Create account</button></>:<>Already registered? <button onClick={()=>setMode('login')}>Sign in</button></>}</div><div className="secure-line"><ShieldCheck size={16}/><span>{isSupabaseConfigured?'Authentication + PostgreSQL RLS are enabled.':'Demo mode only — do not enter sensitive information.'}</span></div></div></div></div>;
}

function Dashboard({data,setTab}){
  const month=monthKey(),accountIds=new Set(data.accounts.map(a=>a.id)),tx=data.transactions.filter(t=>(t.transaction_date||'').startsWith(month)),income=tx.filter(t=>t.type==='income').reduce((s,t)=>s+safeNumber(t.amount),0),spent=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+safeNumber(t.amount),0),balance=data.accounts.reduce((s,a)=>s+safeNumber(a.opening_balance),0)+data.transactions.filter(t=>accountIds.has(t.account_id)).reduce((s,t)=>s+(t.type==='income'?1:-1)*safeNumber(t.amount),0),budget=data.budgets.filter(b=>(b.month||`${month}-01`).startsWith(month)).reduce((s,b)=>s+safeNumber(b.amount),0),upcoming=data.tasks.filter(t=>!t.done).sort((a,b)=>a.due_date.localeCompare(b.due_date)).slice(0,4);const by={};tx.filter(t=>t.type==='expense').forEach(t=>by[t.category]=(by[t.category]||0)+safeNumber(t.amount));const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,5);return <>
    <div className="hero-row"><div><h2 className="page-heading">Your money at a glance</h2><p className="subheading">Track spending, plan ahead, and keep financial tasks in one place.</p></div><button className="secondary" onClick={()=>setTab('Reports')}>View reports <ChevronRight size={15}/></button></div>
    <div className="metric-grid"><Metric label="Total balance" value={money(balance)} note="Across tracked accounts" icon={WalletCards}/><Metric label="Income" value={money(income)} note="This month" icon={TrendingUp}/><Metric label="Spent" value={money(spent)} note="This month" icon={TrendingDown}/><Metric label="Budget left" value={money(Math.max(budget-spent,0))} note={`${money(budget)} monthly budget`} icon={PieChart}/></div>
    <div className="dashboard-grid"><Panel title="Spending by category"><div className="category-list">{top.length?top.map(([cat,val])=><div className="category-row" key={cat}><div className="cat-label"><span>{cat}</span><b>{money(val)}</b></div><div className="progress"><i style={{width:`${Math.min(100,val/Math.max(top[0][1],1)*100)}%`}}/></div></div>):<Empty text="No expenses this month."/>}</div></Panel><Panel title="Upcoming financial tasks"><div>{upcoming.length?upcoming.map(t=><div className="upcoming" key={t.id}><div><b>{t.title}</b><span>{formatDate(t.due_date)} · {t.category}</span></div>{t.amount>0&&<strong>{money(t.amount)}</strong>}</div>):<Empty text="No upcoming tasks."/>}</div></Panel></div>
    <Panel title="Recent transactions"><div>{tx.slice(0,6).map(t=><TransactionRow key={t.id} t={t} data={data}/>)}{!tx.length&&<Empty text="No transactions this month."/>}</div></Panel>
  </>;
}
function Metric({label,value,note,icon:Icon}){return <div className="metric"><div className="metric-top"><span>{label}</span><Icon size={16}/></div><strong>{value}</strong><small>{note}</small></div>}
function Panel({title,children,action}){return <section className="panel"><div className="panel-head"><h2>{title}</h2>{action}</div>{children}</section>}
function Empty({text}){return <div className="empty">{text}</div>}
function TransactionRow({t,data,onDelete}){const a=data.accounts.find(x=>x.id===t.account_id);return <div className="transaction-row"><div className="tx-icon">{t.type==='income'?'+':'−'}</div><div className="tx-main"><b>{t.title}</b><span>{t.category} · {formatDate(t.transaction_date)}{a?` · ${a.name}`:''}</span></div><strong className={t.type==='income'?'income-text':''}>{t.type==='income'?'+':'−'}{money(t.amount)}</strong>{onDelete&&<button className="mini-icon danger" onClick={()=>onDelete(t.id)} title="Delete"><Trash2 size={15}/></button>}</div>}

function Transactions({data,search,onAdd,onDelete}){const [filter,setFilter]=useState('all');const rows=data.transactions.filter(t=>filter==='all'||t.type===filter).filter(t=>`${t.title} ${t.category} ${t.note||''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.transaction_date.localeCompare(a.transaction_date));return <><div className="hero-row"><div><h2 className="page-heading">Transactions</h2><p className="subheading">Every income and expense, searchable in one place.</p></div><button className="primary" onClick={onAdd}><Plus size={16}/> Add transaction</button></div><div className="panel"><div className="filter-row"><button className={filter==='all'?'filter active':'filter'} onClick={()=>setFilter('all')}>All</button><button className={filter==='expense'?'filter active':'filter'} onClick={()=>setFilter('expense')}>Expenses</button><button className={filter==='income'?'filter active':'filter'} onClick={()=>setFilter('income')}>Income</button><span className="muted">{rows.length} records</span></div>{rows.map(t=><TransactionRow key={t.id} t={t} data={data} onDelete={onDelete}/>)}{!rows.length&&<Empty text="No matching transactions."/>}</div></>}

function Accounts({data,setData}){const [name,setName]=useState(''),[type,setType]=useState('Bank'),[opening,setOpening]=useState('');const balances=useMemo(()=>Object.fromEntries(data.accounts.map(a=>[a.id,safeNumber(a.opening_balance)+data.transactions.filter(t=>t.account_id===a.id).reduce((s,t)=>s+(t.type==='income'?1:-1)*safeNumber(t.amount),0)])),[data]);const add=async()=>{if(!name.trim())return;const row={id:uid(),name:name.trim(),type,opening_balance:safeNumber(opening)};setData(d=>({...d,accounts:[...d.accounts,row]}));setName('');setOpening('');};return <><div className="hero-row"><div><h2 className="page-heading">Accounts</h2><p className="subheading">Track balances across bank, cash, UPI, cards and investments.</p></div></div><div className="account-grid">{data.accounts.map(a=><div className="account-card" key={a.id}><div className="account-icon"><WalletCards size={18}/></div><span>{a.type}</span><b>{a.name}</b><strong>{money(balances[a.id])}</strong><small>Calculated from opening balance and transactions</small><button className="mini-icon danger" title="Delete account" onClick={()=>setData(d=>({...d,accounts:d.accounts.filter(x=>x.id!==a.id),transactions:d.transactions.map(t=>t.account_id===a.id?{...t,account_id:null}:t)}))}><Trash2 size={15}/></button></div>)}</div><Panel title="Add account"><div className="form-grid"><label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. HDFC Savings"/></label><label>Type<select value={type} onChange={e=>setType(e.target.value)}>{accountTypes.map(x=><option key={x}>{x}</option>)}</select></label><label>Opening balance<input type="number" value={opening} onChange={e=>setOpening(e.target.value)} placeholder="0"/></label><button className="primary" onClick={add}><Plus size={16}/> Add account</button></div></Panel></>}

function Budget({data,setData}){const month=monthKey(),[category,setCategory]=useState('Food'),[amount,setAmount]=useState(''),spent={};data.transactions.filter(t=>(t.transaction_date||'').startsWith(month)&&t.type==='expense').forEach(t=>spent[t.category]=(spent[t.category]||0)+safeNumber(t.amount));const budgets=data.budgets.filter(b=>(b.month||`${month}-01`).startsWith(month)),total=budgets.reduce((s,b)=>s+safeNumber(b.amount),0),used=Object.values(spent).reduce((s,v)=>s+v,0),monthLabel=new Date(`${month}-01T00:00:00`).toLocaleString('en-IN',{month:'long'}),add=()=>{const value=safeNumber(amount);if(!category||value<0)return;setData(d=>{const existing=d.budgets.find(b=>(b.month||`${month}-01`).startsWith(month)&&b.category===category);return {...d,budgets:existing?d.budgets.map(b=>b.id===existing.id?{...b,amount:value}:b):[...d.budgets,{id:uid(),category,amount:value,month:`${month}-01`}]}});setAmount('')};return <><div className="hero-row"><div><h2 className="page-heading">{monthLabel} budget</h2><p className="subheading">Set limits by category and compare them with actual spending.</p></div><div className="budget-total"><span>{money(Math.max(total-used,0))}</span><small>remaining</small></div></div><div className="budget-list">{budgets.map(b=>{const s=spent[b.category]||0,p=Math.min(100,s/Math.max(safeNumber(b.amount),1)*100);return <div className="budget-card" key={b.id}><div className="budget-card-head"><div><b>{b.category}</b><span>{money(s)} spent of {money(b.amount)}</span></div><strong>{Math.round(p)}%</strong><button className="mini-icon danger" title="Delete budget" onClick={()=>setData(d=>({...d,budgets:d.budgets.filter(x=>x.id!==b.id)}))}><Trash2 size={15}/></button></div><div className="progress"><i style={{width:`${p}%`}}/></div><div className="budget-edit"><input type="number" min="0" value={b.amount} onChange={e=>setData(d=>({...d,budgets:d.budgets.map(x=>x.id===b.id?{...x,amount:Math.max(0,safeNumber(e.target.value))}:x)}))}/><span>monthly limit</span></div></div>})}</div><Panel title="Add or replace a category budget"><div className="form-grid"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.filter(x=>x!=='Salary').map(x=><option key={x}>{x}</option>)}</select></label><label>Monthly limit<input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="5000"/></label><button className="primary" onClick={add}><Plus size={16}/> Save budget</button></div></Panel></>}

function Goals({data,setData}){const [name,setName]=useState(''),[target,setTarget]=useState(''),[due,setDue]=useState('');const add=()=>{if(!name.trim()||safeNumber(target)<=0)return;setData(d=>({...d,goals:[...d.goals,{id:uid(),name:name.trim(),target_amount:safeNumber(target),saved_amount:0,target_date:due||null}]}));setName('');setTarget('');setDue('')};return <><div className="hero-row"><div><h2 className="page-heading">Goals</h2><p className="subheading">Turn savings into measurable targets.</p></div></div><div className="goal-grid">{data.goals.map(g=>{const p=Math.min(100,safeNumber(g.saved_amount)/Math.max(safeNumber(g.target_amount),1)*100);return <div className="goal-card" key={g.id}><div className="goal-ring"><span>{Math.round(p)}%</span></div><div className="goal-content"><b>{g.name}</b><span>{money(g.saved_amount)} saved of {money(g.target_amount)}</span><div className="progress"><i style={{width:`${p}%`}}/></div><small>{g.target_date?`Target ${formatDate(g.target_date)}`:'No target date'}</small></div><button className="mini-icon danger" title="Delete goal" onClick={()=>setData(d=>({...d,goals:d.goals.filter(x=>x.id!==g.id)}))}><Trash2 size={15}/></button></div>})}</div><Panel title="Create a goal"><div className="form-grid"><label>Goal name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Emergency fund"/></label><label>Target amount<input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="100000"/></label><label>Target date<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><button className="primary" onClick={add}><Plus size={16}/> Add goal</button></div></Panel></>}

function Tasks({data,setData}){const [title,setTitle]=useState(''),[due,setDue]=useState(''),[amount,setAmount]=useState(''),[accountId,setAccountId]=useState(data.accounts[0]?.id||''),[expense,setExpense]=useState(false);const add=()=>{if(!title.trim()||!due)return;setData(d=>({...d,tasks:[...d.tasks,{id:uid(),title:title.trim(),due_date:due,amount:safeNumber(amount),account_id:accountId||null,category:'Planning',done:false,create_expense_on_complete:expense}]}));setTitle('');setDue('');setAmount('');setExpense(false)};const toggle=t=>{setData(d=>{const current=d.tasks.find(x=>x.id===t.id);if(!current)return d;const done=!current.done,shouldCreate=done&&current.create_expense_on_complete&&safeNumber(current.amount)>0&&!d.transactions.some(x=>x.task_id===current.id);return {...d,tasks:d.tasks.map(x=>x.id===current.id?{...x,done}:x),transactions:shouldCreate?[{id:uid(),title:current.title,category:current.category,amount:safeNumber(current.amount),type:'expense',transaction_date:today(),account_id:current.account_id||null,note:'Created from completed task',task_id:current.id},...d.transactions]:d.transactions}})};return <><div className="hero-row"><div><h2 className="page-heading">Tasks</h2><p className="subheading">Convert upcoming money actions into an actionable checklist.</p></div></div><div className="task-list">{[...data.tasks].sort((a,b)=>a.due_date.localeCompare(b.due_date)).map(t=><div className={`task-row ${t.done?'done':''}`} key={t.id}><button className="check-btn" onClick={()=>toggle(t)}>{t.done&&<Check size={15}/>}</button><div><b>{t.title}</b><span>{formatDate(t.due_date)} · {t.category}{t.create_expense_on_complete?' · creates expense when completed':''}</span></div>{safeNumber(t.amount)>0&&<strong>{money(t.amount)}</strong>}<button className="mini-icon danger" title="Delete task" onClick={()=>setData(d=>({...d,tasks:d.tasks.filter(x=>x.id!==t.id)}))}><Trash2 size={15}/></button></div>)}{!data.tasks.length&&<Empty text="No tasks yet."/>}</div><Panel title="Add task"><div className="form-grid"><label>Task<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Pay electricity bill"/></label><label>Due date<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><label>Amount<input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/></label><label>Account<select value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">No account</option>{data.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="check-label"><input type="checkbox" checked={expense} onChange={e=>setExpense(e.target.checked)}/> Create expense when completed</label><button className="primary" onClick={add}><Plus size={16}/> Add task</button></div></Panel></>}

function Subscriptions({data,setData}){const [name,setName]=useState(''),[amount,setAmount]=useState(''),[cycle,setCycle]=useState('Monthly'),[nextDate,setNextDate]=useState(today());const monthly=data.subscriptions.reduce((s,x)=>s+safeNumber(x.amount)*({Weekly:52/12,Monthly:1,Quarterly:1/3,Yearly:1/12}[x.cycle]||1),0),add=()=>{if(!name.trim()||safeNumber(amount)<=0||!nextDate)return;setData(d=>({...d,subscriptions:[...d.subscriptions,{id:uid(),name:name.trim(),amount:safeNumber(amount),cycle,next_date:nextDate,category:'Subscription'}]}));setName('');setAmount('');setCycle('Monthly');setNextDate(today())};return <><div className="hero-row"><div><h2 className="page-heading">Subscriptions</h2><p className="subheading">See recurring services and their annual impact.</p></div></div><div className="metric-grid three"><Metric label="Monthly equivalent" value={money(monthly)} note="Recurring spend" icon={Repeat}/><Metric label="Yearly" value={money(monthly*12)} note="If unchanged" icon={BarChart3}/><Metric label="Services" value={data.subscriptions.length} note="Tracked subscriptions" icon={CreditCard}/></div><Panel title="Active subscriptions">{data.subscriptions.map(s=><div className="subscription-row" key={s.id}><div className="sub-icon"><Repeat size={17}/></div><div><b>{s.name}</b><span>{s.cycle} · Next {formatDate(s.next_date)}</span></div><strong>{money(s.amount)}</strong><button className="mini-icon danger" title="Delete subscription" onClick={()=>setData(d=>({...d,subscriptions:d.subscriptions.filter(x=>x.id!==s.id)}))}><Trash2 size={15}/></button></div>)}</Panel><Panel title="Add subscription"><div className="form-grid"><label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Streaming service"/></label><label>Amount<input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="999"/></label><label>Billing cycle<select value={cycle} onChange={e=>setCycle(e.target.value)}>{['Weekly','Monthly','Quarterly','Yearly'].map(x=><option key={x}>{x}</option>)}</select></label><label>Next charge<input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)}/></label><button className="primary" onClick={add}><Plus size={16}/> Add subscription</button></div></Panel></>}

function Reports({data}){const months=[...new Set(data.transactions.map(t=>(t.transaction_date||'').slice(0,7)).filter(Boolean))].sort().slice(-6);const monthly=months.map(m=>{const tx=data.transactions.filter(t=>(t.transaction_date||'').startsWith(m));return {m,income:tx.filter(t=>t.type==='income').reduce((s,t)=>s+safeNumber(t.amount),0),expense:tx.filter(t=>t.type==='expense').reduce((s,t)=>s+safeNumber(t.amount),0)}});const cur=monthly.at(-1)||{income:0,expense:0};const by={};data.transactions.filter(t=>(t.transaction_date||'').startsWith(monthKey())&&t.type==='expense').forEach(t=>by[t.category]=(by[t.category]||0)+safeNumber(t.amount));const max=Math.max(...Object.values(by),1);return <><div className="hero-row"><div><h2 className="page-heading">Reports</h2><p className="subheading">Understand trends and compare income with spending.</p></div></div><div className="report-cards"><div><span>Income</span><b>{money(cur.income)}</b></div><div><span>Expenses</span><b>{money(cur.expense)}</b></div><div><span>Saved</span><b>{money(Math.max(cur.income-cur.expense,0))}</b></div><div><span>Savings rate</span><b>{cur.income?Math.round((cur.income-cur.expense)/cur.income*100):0}%</b></div></div><Panel title="Current-month spending"><div className="report-bars">{Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([cat,val])=><div className="report-bar" key={cat}><div><span>{cat}</span><b>{money(val)}</b></div><div className="bar-track"><i style={{width:`${val/max*100}%`}}/></div></div>)}{!Object.keys(by).length&&<Empty text="No spending data for this month."/>}</div></Panel><Panel title="Monthly trend"><div className="trend-table">{monthly.map(x=><div key={x.m}><span>{x.m}</span><b>{money(x.income)}</b><strong>{money(x.expense)}</strong></div>)}{!monthly.length&&<Empty text="No report data yet."/>}</div></Panel></>}

function SettingsPage({data,setData,exportData,importData,cloud}){const [name,setName]=useState(data.profile.name);return <><div className="hero-row"><div><h2 className="page-heading">Settings</h2><p className="subheading">Manage profile, backups and deployment mode.</p></div></div><div className="two-panels"><Panel title="Profile"><div className="form-grid"><label>Display name<input value={name} onChange={e=>setName(e.target.value)}/></label><button className="primary" onClick={()=>setData(d=>({...d,profile:{...d.profile,name:name.trim()||'Personal User'}}))}>Save profile</button></div></Panel><Panel title="Backup & portability"><p className="setting-copy">Export creates a JSON backup of the workspace currently visible in the app. In cloud mode, the authoritative copy remains the database.</p><div className="backup-actions"><button className="secondary" onClick={exportData}><Download size={16}/> Export backup</button><label className="secondary file-btn"><Upload size={16}/> Import local backup<input type="file" accept="application/json" onChange={e=>importData(e.target.files?.[0])}/></label></div></Panel></div><Panel title="Security status"><div className="security-grid"><div><ShieldCheck size={20}/><b>{cloud?'Managed authentication':'Local demo authentication'}</b><span>{cloud?'Supabase Auth handles passwords and sessions.':'Local demo mode is for UI testing only.'}</span></div><div><LockKeyhole size={20}/><b>{cloud?'PostgreSQL Row Level Security':'Not production-safe'}</b><span>{cloud?'Every user-owned table is restricted by auth.uid().':'Configure Supabase before entering real financial data.'}</span></div><div><UserRound size={20}/><b>User isolation</b><span>Production records carry an authenticated owner identity; the client does not choose another user's owner ID.</span></div></div></Panel></>}

function AddTransaction({accounts,onClose,onSave}){const [title,setTitle]=useState(''),[amount,setAmount]=useState(''),[type,setType]=useState('expense'),[category,setCategory]=useState('Food'),[accountId,setAccountId]=useState(accounts[0]?.id||''),[date,setDate]=useState(today()),[note,setNote]=useState('');const save=e=>{e.preventDefault();if(!title.trim()||safeNumber(amount)<=0)return;onSave({title:title.trim(),amount:safeNumber(amount),type,category,account_id:accountId||null,transaction_date:date,note:note.trim()})};return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><div><h2>Add transaction</h2><span>Record income or an expense.</span></div><button className="mini-icon" onClick={onClose}><X size={18}/></button></div><form onSubmit={save}><div className="segmented"><button type="button" className={type==='expense'?'selected':''} onClick={()=>setType('expense')}>Expense</button><button type="button" className={type==='income'?'selected':''} onClick={()=>setType('income')}>Income</button></div><div className="form-grid"><label>Title<input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Groceries"/></label><label>Amount<input required min="1" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select></label><label>Account<select value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">No account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Note<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional"/></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary">Save transaction</button></div></form></div></div>}

createRoot(document.getElementById('root')).render(<App/>);
