const BASE_URL = 'https://wabot-b.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});

const sections = {
    overview: document.getElementById('section-overview'),
    approvals: document.getElementById('section-approvals'),
    clients: document.getElementById('section-clients'),
    support: document.getElementById('section-support')
};

const navs = {
    overview: document.getElementById('nav-overview'),
    approvals: document.getElementById('nav-approvals'),
    clients: document.getElementById('nav-clients'),
    support: document.getElementById('nav-support')
};

let currentTicketId = null;

window.showSection = (sectionId) => {
    Object.keys(sections).forEach(id => sections[id].classList.add('hidden'));
    Object.keys(navs).forEach(id => navs[id] && navs[id].classList.remove('active'));

    sections[sectionId].classList.remove('hidden');
    if (navs[sectionId]) navs[sectionId].classList.add('active');

    const titles = {
        overview: "Network Dashboard",
        approvals: "Client Approvals",
        clients: "Total Clients",
        support: "Customer Support"
    };
    const descs = {
        overview: "System-wide overview and client management.",
        approvals: "Review and approve new registration requests.",
        clients: "Manage approved business accounts and their data.",
        support: "Reply to client inquiries and issues."
    };

    document.getElementById('sectionTitle').textContent = titles[sectionId];
    document.getElementById('sectionDesc').textContent = descs[sectionId];

    if (sectionId === 'support') loadSupportTickets();
};

async function loadAllData() {
    await Promise.all([
        loadStats(),
        loadClients(),
        loadSupportTickets()
    ]);
}

// Support Logic
async function loadSupportTickets() {
    try {
        const res = await fetch(`${BASE_URL}/api/admin/support/tickets`);
        const tickets = await res.json();
        renderTickets(tickets);
        if (currentTicketId) {
            const ticket = tickets.find(t => t.id === currentTicketId);
            if (ticket) renderAdminMessages(ticket.messages);
        }
    } catch (err) { console.error('Error loading tickets:', err); }
}

function renderTickets(tickets) {
    const list = document.getElementById('ticketList');
    if (!tickets.length) {
        list.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-muted);">No active tickets.</p>';
        return;
    }
    list.innerHTML = tickets.map(t => `
        <div class="ticket-item ${t.id === currentTicketId ? 'active' : ''}" onclick="selectTicket('${t.id}')" style="padding: 1.25rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: all 0.2s;">
            <div style="font-weight: 700;">${t.clientName}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Last update: ${new Date(t.lastUpdate).toLocaleTimeString()}</div>
        </div>
    `).join('');
}

window.selectTicket = async (id) => {
    currentTicketId = id;
    const res = await fetch(`${BASE_URL}/api/admin/support/tickets`);
    const tickets = await res.json();
    const ticket = tickets.find(t => t.id === id);
    
    document.getElementById('chatHeaderName').textContent = `Chat with ${ticket.clientName}`;
    document.getElementById('adminReplyArea').classList.remove('hidden');
    renderAdminMessages(ticket.messages);
    loadSupportTickets(); // Refresh list to show active state
};

function renderAdminMessages(messages) {
    const container = document.getElementById('adminChatMessages');
    container.innerHTML = messages.map(m => `
        <div style="align-self: ${m.sender === 'admin' ? 'flex-end' : 'flex-start'}; max-width: 80%; padding: 12px 16px; border-radius: 16px; background: ${m.sender === 'admin' ? 'var(--primary)' : '#ffffff'}; color: ${m.sender === 'admin' ? '#ffffff' : 'var(--text-main)'}; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: ${m.sender === 'client' ? '1px solid var(--border)' : 'none'};">
            <div style="font-size: 0.9375rem;">${m.text}</div>
            <div style="font-size: 0.7rem; margin-top: 4px; opacity: 0.7; text-align: right;">${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

document.getElementById('adminReplyForm').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('adminReplyInput');
    const message = input.value.trim();
    if (!message || !currentTicketId) return;

    try {
        const res = await fetch(`${BASE_URL}/api/admin/support/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId: currentTicketId, message })
        });
        if (res.ok) {
            input.value = '';
            loadSupportTickets();
        }
    } catch (err) { console.error('Error replying:', err); }
};

setInterval(() => {
    if (!sections.support.classList.contains('hidden')) {
        loadSupportTickets();
    }
}, 10000);

// Admin Actions
window.openAddClientModal = () => {
    document.getElementById('addClientModal').classList.remove('hidden');
};

window.closeAddClientModal = () => {
    document.getElementById('addClientModal').classList.add('hidden');
    document.getElementById('addClientForm').reset();
};

document.getElementById('addClientForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('addClientName').value;
    const email = document.getElementById('addClientEmail').value;
    const password = document.getElementById('addClientPassword').value;

    try {
        const res = await fetch(`${BASE_URL}/api/admin/clients/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Client created successfully!');
            closeAddClientModal();
            loadAllData();
        } else {
            alert(data.error || 'Failed to create client');
        }
    } catch (err) {
        alert('Connection error');
    }
};

async function loadStats() {
    try {
        const res = await fetch(`${BASE_URL}/api/admin/stats`);
        const stats = await res.json();
        
        document.getElementById('stat-total-clients').textContent = stats.totalClients;
        document.getElementById('stat-total-docs').textContent = `${stats.totalDocs} Files`;
        document.getElementById('stat-pending').textContent = stats.pendingApprovals;
        document.getElementById('stat-approved').textContent = stats.approvedClients;
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

async function loadClients() {
    try {
        const res = await fetch(`${BASE_URL}/api/admin/clients`);
        const clients = await res.json();
        
        renderApprovals(clients.filter(c => c.status === 'pending' || c.status === 'rejected'));
        renderClients(clients.filter(c => c.status === 'approved'));
    } catch (err) {
        console.error('Error loading clients:', err);
    }
}

function renderApprovals(clients) {
    const tbody = document.getElementById('approvalTableBody');
    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>
                <div style="font-weight: 600;">${client.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted)">${client.email || 'No email'}</div>
            </td>
            <td>${client.username}</td>
            <td>${new Date(client.createdAt).toLocaleDateString()}</td>
            <td><span class="badge badge-${client.status}">${client.status.toUpperCase()}</span></td>
            <td>
                ${client.status !== 'approved' ? `<button class="btn btn-primary btn-sm" onclick="approveClient('${client.id}')">Approve</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderClients(clients) {
    const grid = document.getElementById('clientGrid');
    if (!clients.length) {
        grid.innerHTML = '<div class="data-card" style="grid-column: 1/-1; padding: 3rem; text-align: center;"><p style="color: var(--text-muted)">No approved clients found.</p></div>';
        return;
    }

    grid.innerHTML = clients.map(client => `
        <div class="data-card client-card">
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--primary-light); overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        ${client.logoUrl ? `<img src="${client.logoUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary)"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>'}
                    </div>
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 700;">${client.name}</h3>
                        <div class="badge ${client.isBotActive ? 'badge-approved' : 'badge-pending'}" style="margin-top: 4px;">
                            <span class="dot" style="background: currentColor"></span>
                            ${client.isBotActive ? 'LIVE' : 'INACTIVE'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="padding: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div>
                    <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Account ID</label>
                    <div style="font-weight: 600; font-family: monospace; font-size: 0.875rem;">${client.id}</div>
                </div>
                <div>
                    <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Registered On</label>
                    <div style="font-weight: 600; font-size: 0.875rem;">${new Date(client.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                    <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">WhatsApp Number</label>
                    <div style="font-weight: 600; font-size: 0.875rem;">${client.whatsappNumber || 'Not set'}</div>
                </div>
                <div>
                    <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Knowledge Base</label>
                    <div style="font-weight: 600; font-size: 0.875rem;">${client.documentCount} Documents</div>
                </div>
            </div>

            <div style="padding: 1rem 1.5rem; background: #f8fafc; border-radius: 0 0 24px 24px; display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: transparent;" onclick="deleteClient('${client.id}')">Delete Account</button>
            </div>
        </div>
    `).join('');
}

window.approveClient = async (id) => {
    const res = await fetch(`${BASE_URL}/api/admin/clients/${id}/approve`, { method: 'POST' });
    if (res.ok) loadAllData();
};

window.openClientModal = async (id) => {
    const res = await fetch(`${BASE_URL}/api/admin/clients`);
    const clients = await res.json();
    const client = clients.find(c => c.id === id);
    if (!client) return;

    const modal = document.getElementById('clientModal');
    const modalBody = document.getElementById('modalBody');
    document.getElementById('modalClientName').textContent = client.name;

    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Account ID</label>
                <div style="font-weight: 600; font-family: monospace;">${client.id}</div>
            </div>
            <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Registered On</label>
                <div style="font-weight: 600;">${new Date(client.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">WhatsApp Number</label>
                <div style="font-weight: 600;">${client.whatsappNumber || 'Not set'}</div>
            </div>
            <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Knowledge Base</label>
                <div style="font-weight: 600;">${client.documentCount} Documents uploaded</div>
            </div>
        </div>
        
        <div style="padding-top: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between;">
            <button class="btn btn-outline" onclick="closeModal()">Close Details</button>
            <button class="btn btn-primary" style="background: var(--danger);" onclick="deleteClient('${client.id}')">Delete Client Account</button>
        </div>
    `;

    modal.classList.remove('hidden');
};

window.deleteClient = async (id) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this client and all their documents?')) return;
    const res = await fetch(`${BASE_URL}/api/admin/clients/${id}`, { method: 'DELETE' });
    if (res.ok) {
        closeModal();
        loadAllData();
    }
};

window.closeModal = () => {
    document.getElementById('clientModal').classList.add('hidden');
};
