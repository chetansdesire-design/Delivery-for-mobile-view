/* ==========================================================================
   URBAN CASA - core.js  (shared by index.html [web] AND mobile.html)
   --------------------------------------------------------------------------
   Anything that is a RULE of the business lives here, so you change it ONCE
   and both the web app and the mobile app pick it up:
     - who can see / use what (roles, Complaints access)
     - status flow (NEW -> PENDING -> DELIVERED)
     - balance calculation, dispatch-challan text, log stamp, database URL
   The two HTML files only draw the screen.
   ========================================================================== */
const UC = (function () {

    // Firebase Realtime Database (same database for web + mobile)
    const dbURL = "https://new-dispatch-approval-default-rtdb.firebaseio.com/";

    // ---- Extra people who get the full COMPLAINTS department, whatever their role.
    // Add a lowercase first name here to give someone else the same access.
    const COMPLAINTS_EXTRA_USERS = ['satish'];

    const nameOf = (key) => String(key).split(' (')[0].trim().toLowerCase();

    // Role flags from the login key, e.g. "Satish (Supervisor)" or "Admin"
    function roles(R) {
        R = String(R || '');
        const admin  = R.includes('Admin');
        const cash   = R.includes('Cashier') || R.includes('Accountant');
        const fin    = admin || cash;
        const mannu  = R.toLowerCase().includes('mannu') || R.includes('Approver');
        const sup    = R.includes('Supervisor') || R.includes('Dispatch');
        const svc    = R.includes('Service');
        const n      = nameOf(R);
        const extra  = COMPLAINTS_EXTRA_USERS.some(x => n === x || n.split(' ')[0] === x);
        return {
            admin, cash, fin, mannu, sup, svc,
            appr: fin || mannu,              // can approve orders
            comp: fin || svc || extra,       // can open the Complaints department
            compUp: admin || svc || extra    // can add / replace complaint pictures
        };
    }

    // "SATISH @ 15/11 14:05"
    function logInfo(R) {
        const now = new Date();
        const dateStr = now.getDate() + '/' + (now.getMonth() + 1);
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${String(R || '').split(' ')[0].toUpperCase()} @ ${dateStr} ${timeStr}`;
    }

    // Payments: total paid + balance left
    function calc(i) {
        let paid = 0;
        if (i && i.transactions) {
            Object.keys(i.transactions).forEach(k => { paid += Number(i.transactions[k].amount) || 0; });
        }
        return { paid, bal: Number((i && i.payAmount) || 0) - paid };
    }

    // Order status cycle: returns the fields to save
    function nextStatus(cur) {
        const s = {
            'NEW':       { statusText: 'PENDING',   statusClass: 'status-pending',   approved: false },
            'PENDING':   { statusText: 'DELIVERED', statusClass: 'status-delivered', approved: true  },
            'DELIVERED': { statusText: 'NEW',       statusClass: 'status-new',       approved: false }
        };
        const n = Object.assign({}, s[cur] || s['DELIVERED']);
        n.deliveredDate = n.statusText === 'DELIVERED' ? new Date().toISOString().split('T')[0] : null;
        return n;
    }

    // Complaint status cycle
    function nextComplaint(cur) {
        const s = {
            'NEW':         { statusText: 'IN PROGRESS', statusClass: 'status-pending' },
            'IN PROGRESS': { statusText: 'RESOLVED',    statusClass: 'status-delivered' },
            'RESOLVED':    { statusText: 'NEW',         statusClass: 'status-new' }
        };
        return Object.assign({}, s[cur] || s['NEW']);
    }

    // Dispatch challan text (pk = number of packages, mobile only; web leaves it out)
    function dcText(i, R, pk) {
        const { paid, bal } = calc(i);
        const dispatchDate = new Date().toLocaleDateString('en-GB');
        const billDate = new Date(i.date).toLocaleDateString('en-GB');
        const due = (i.payPending === 'YES' && !i.payReceived && bal > 0) ? `₹${bal}` : '₹0';
        const pkgLine = (pk !== undefined && pk !== null && pk !== '') ? `\n📦Packages: ${pk}` : '';
        return `URBAN CASA\nRaichandani Mall - Kompally\nDISPATCH CHALLAN\n------------------------------------------\n📅Dispatch Date: ${dispatchDate}\n\n📅Bill Date: ${billDate}\n\n🧾Bill No: ${i.billNo || '-'}\n\n👤Customer: ${i.name}\n📱Mobile: ${i.phone || '-'}\n\n👤Sales Executive: ${i.exec || '-'}\n\n📍Location: ${i.loc || '-'}\n\n📒Qty: ${i.qty || '0'}${pkgLine}\n\n💵Total Bill: ₹${i.payAmount || 0}\n💳Advance Paid: ₹${paid}\n💰To Collect: ${due}\n\n✅QC Checked By: ${String(R || '').split(' ')[0].toUpperCase()}\n------------------------------------------\n🚚Status: Dispatched`;
    }

    return { dbURL, roles, logInfo, calc, nextStatus, nextComplaint, dcText };
})();
