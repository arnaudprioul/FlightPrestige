import { AppDataSource } from '../configs/database.config'
import { Alert } from '../entities/alert.entity'
import type { User } from '../entities/user.entity'
import type { Price } from '../entities/price.entity'
import type { Route } from '../entities/route.entity'

export class NotificationService {
  private formatMessage(alert: Alert, price: Price, route: Route, baseline: number): string {
    const savings = Math.round(((baseline - Number(price.price)) / baseline) * 100)
    const emoji = alert.level === 'INSANE' ? '🔥' : '✈️'
    return [
      `${emoji} ${alert.level} DEAL: ${route.origin} → ${route.destination}`,
      `Business class: €${price.price} (economy avg: €${Math.round(baseline)})`,
      `Save ~${savings}% vs typical economy price`,
      `Airline: ${price.airline} | Stops: ${price.stops} | Duration: ${Math.round(price.durationMinutes / 60)}h`,
    ].join('\n')
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) { console.warn('RESEND_API_KEY not set — skipping email'); return }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'alerts@flightprestige.com',
        to,
        subject,
        text: body,
      }),
    })

    if (!res.ok) console.error('Email send failed:', await res.text())
  }

  async sendSms(to: string, body: string): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM_PHONE

    if (!sid || !token || !from) { console.warn('Twilio not configured — skipping SMS'); return }

    const credentials = Buffer.from(`${sid}:${token}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    })

    if (!res.ok) console.error('SMS send failed:', await res.text())
  }

  async notifyUser(user: User, alert: Alert, price: Price, route: Route, baseline: number): Promise<void> {
    const message = this.formatMessage(alert, price, route, baseline)
    const subject = `${alert.level} Deal: ${route.origin} → ${route.destination} at €${price.price}`

    await Promise.all([
      user.notifyEmail && user.email ? this.sendEmail(user.email, subject, message) : null,
      user.notifySms && user.phone ? this.sendSms(user.phone, message) : null,
    ])

    await AppDataSource.getRepository(Alert).update(alert.id, { sentAt: new Date() })
  }
}

export const notificationService = new NotificationService()
