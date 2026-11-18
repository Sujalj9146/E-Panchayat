/**
 * The SMS the server sent (or tried to send) about one complaint.
 *
 * Read from `sms_notifications`, so it shows what actually happened at the
 * gateway — including the messages that were not delivered and why — rather
 * than assuming every SMS arrived.
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';

import type { SmsNotification } from '../lib/api';

const EVENT_LABEL: Record<SmsNotification['event'], { en: string; mr: string }> = {
  registered: { en: 'Complaint registered', mr: 'तक्रार नोंदवली' },
  accepted: { en: 'Accepted by officer', mr: 'अधिकाऱ्याने स्वीकारली' },
  resolved: { en: 'Complaint resolved', mr: 'तक्रार निकाली' },
  reopened: { en: 'Complaint reopened', mr: 'तक्रार पुन्हा उघडली' },
};

const STATUS_LABEL: Record<SmsNotification['status'], { en: string; mr: string; style: string }> = {
  sent: { en: 'Sent', mr: 'पाठवला', style: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  logged: {
    en: 'Demo — not sent',
    mr: 'डेमो — पाठवला नाही',
    style: 'bg-slate-100 text-slate-600 border-slate-300',
  },
  failed: { en: 'Failed', mr: 'अयशस्वी', style: 'bg-rose-50 text-rose-800 border-rose-300' },
  skipped: { en: 'No number', mr: 'क्रमांक नाही', style: 'bg-amber-50 text-amber-900 border-amber-300' },
};

export const SmsLog: React.FC<{
  notifications: SmsNotification[];
  isEnglish: boolean;
  /** Officers see gateway errors; residents see only that it failed. */
  showErrors?: boolean;
}> = ({ notifications, isEnglish, showErrors = false }) => {
  if (!notifications.length) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 m-0 flex items-center gap-1.5">
        <MessageSquare size={11} />
        {isEnglish ? 'SMS updates' : 'एसएमएस सूचना'}
      </h3>
      <ul className="space-y-2 m-0 p-0 list-none">
        {notifications.map((n) => {
          const status = STATUS_LABEL[n.status] ?? STATUS_LABEL.failed;
          const event = EVENT_LABEL[n.event];
          return (
            <li key={n.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700">
                  {event ? (isEnglish ? event.en : event.mr) : n.event}
                  {n.phoneMasked && (
                    <span className="font-normal text-slate-400"> · {n.phoneMasked}</span>
                  )}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${status.style}`}
                >
                  {isEnglish ? status.en : status.mr}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 m-0 leading-relaxed break-words">{n.message}</p>
              <p className="text-[10px] text-slate-400 m-0">
                {new Date(n.createdAt).toLocaleString(isEnglish ? 'en-IN' : 'mr-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {showErrors && n.error && <span className="text-rose-600"> · {n.error}</span>}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
