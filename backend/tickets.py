import json
import os
from datetime import datetime

TICKETS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'tickets.json')

def load_tickets():
    if not os.path.exists(TICKETS_FILE):
        return []
    with open(TICKETS_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_tickets(tickets):
    os.makedirs(os.path.dirname(TICKETS_FILE), exist_ok=True)
    with open(TICKETS_FILE, 'w') as f:
        json.dump(tickets, f, indent=2)

def generate_id(tickets):
    return max([t['id'] for t in tickets], default=0) + 1

def raise_ticket(employee_name, department, ticket_type, reason, date):
    tickets = load_tickets()
    ticket  = {
        'id':           generate_id(tickets),
        'employee':     employee_name,
        'department':   department,
        'type':         ticket_type,
        'reason':       reason,
        'date':         date,
        'status':       'Pending',
        'raised_at':    datetime.now().strftime('%Y-%m-%d %H:%M'),
        'resolved_at':  None,
        'manager_note': None,
    }
    tickets.append(ticket)
    save_tickets(tickets)
    return ticket

def update_ticket(ticket_id, status, manager_note=''):
    tickets = load_tickets()
    for t in tickets:
        if t['id'] == ticket_id:
            t['status']       = status
            t['resolved_at']  = datetime.now().strftime('%Y-%m-%d %H:%M')
            t['manager_note'] = manager_note
            save_tickets(tickets)
            return t
    return {'error': 'Ticket not found'}

def edit_ticket(ticket_id, updated_data):
    tickets = load_tickets()
    for t in tickets:
        if t['id'] == ticket_id:
            # Only allow editing reason, date, type — not status or id
            for field in ['reason', 'date', 'type', 'department']:
                if field in updated_data:
                    t[field] = updated_data[field]
            save_tickets(tickets)
            return t
    return {'error': 'Ticket not found'}

def delete_ticket(ticket_id):
    tickets     = load_tickets()
    new_tickets = [t for t in tickets if t['id'] != ticket_id]
    if len(new_tickets) == len(tickets):
        return {'error': 'Ticket not found'}
    save_tickets(new_tickets)
    return {'message': 'Deleted successfully'}

def get_tickets(status=None, date=None):
    tickets = load_tickets()
    if status:
        tickets = [t for t in tickets if t['status'] == status]
    if date:
        tickets = [t for t in tickets if t['date'] == date]
    return sorted(tickets, key=lambda x: x['id'], reverse=True)

def get_approved_leaves(date):
    tickets = load_tickets()
    return [
        t['employee'] for t in tickets
        if t['date']   == date
        and t['status'] == 'Approved'
        and t['type']   in ['sick_leave', 'leave']
    ]

def get_half_day_employees(date):
    tickets = load_tickets()
    return [
        t['employee'] for t in tickets
        if t['date']   == date
        and t['status'] == 'Approved'
        and t['type']   == 'half_day'
    ]