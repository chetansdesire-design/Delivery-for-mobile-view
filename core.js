/* URBAN CASA - SHARED CORE (used by desktop + mobile).
   Edit rules, export format or status flow HERE once; both apps pick it up. */
window.UC=(function(){
 const iso=d=>d.toISOString().split('T')[0];
 return{
  dbURL:"https://new-dispatch-approval-default-rtdb.firebaseio.com/",
  iso,
  roles(R){const has=s=>R.includes(s),fin=has('Admin')||has('Cashier')||has('Accountant'),mannu=R.toLowerCase().includes('mannu'),svc=has('Service'),sup=has('Supervisor')||has('Dispatch');
   return{fin,mannu,svc,sup,appr:fin||mannu,cash:has('Cashier')||has('Accountant'),admin:has('Admin')}},
  logInfo(R){const n=new Date();return `${R.split(' ')[0].toUpperCase()} @ ${n.getDate()}/${n.getMonth()+1} ${n.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false})}`},
  calc(i){let b=Number(i.payAmount||0),p=0;if(i.transactions)Object.values(i.transactions).forEach(t=>{b-=Number(t.amount);p+=Number(t.amount)});return{bal:b,paid:p}},
  nextStatus(cur){
   const s={NEW:{t:'PENDING',c:'status-pending',a:false},PENDING:{t:'DELIVERED',c:'status-delivered',a:true},DELIVERED:{t:'NEW',c:'status-new',a:false}},n=s[cur];
   return{statusText:n.t,statusClass:n.c,approved:n.a,deliveredDate:n.t==='DELIVERED'?iso(new Date()):null}},
  nextComplaint(cur){
   const s={'NEW':['IN PROGRESS','status-pending'],'IN PROGRESS':['RESOLVED','status-delivered'],'RESOLVED':['NEW','status-new']},n=s[cur];
   return{statusText:n[0],statusClass:n[1]}},
  dcText(i,R,pk){
   const {bal}=this.calc(i),due=(i.payPending==='YES'&&!i.payReceived&&bal>0)?'₹'+bal:'PAID';
   return `URBAN CASA DISPATCH\n------------------------------------------\n📅Dispatch Date: ${new Date().toLocaleDateString('en-GB')}\n\n📅Bill Date: ${new Date(i.date).toLocaleDateString('en-GB')}\n\n🧾Bill No: ${i.billNo||'-'}\n\n👤Customer: ${i.name}\n\n📱Mobile: ${i.phone||'-'}\n\n👤Sales Executive: ${i.exec||'-'}\n\n📍Location: ${i.loc||'-'}\n\n📒Qty: ${i.qty||0}\n\n📦Packages: ${pk}\n\n💰Payment Due: ${due}\n\n✅QC Checked By: ${R.split(' ')[0]}\n------------------------------------------\n🚚Status: Dispatched`}
 };
})();
