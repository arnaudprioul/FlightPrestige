import type { IAlert, IRoute, IPrice, IUser } from '../types/index.js'
import { query } from '../db/index.js'

export class NotificationService {
  private async markAlertSent(alertId: string): Promise<void> {
    await query(`UPDATE alerts SET sent_at = NOW() WHERE id = $1`, [alertId])
  }

  private formatDealMessage(alert: IAlert, price: IPrice, route: IRoute, baseline: number): string {
    const savings = Math.round(((baseline - price.price) / baseline) * 100)
    const emoji = alert.level === 'INSANE' ? '🔥' : '✈️'
    return [
      `${emoji} ${alert.level} DEAL: ${route.origin} → ${route.destination}`,
      `Business class: €${price.price} (economy avg: €${Math.round(baseline)})`,
      `Save ~${savings}% vs typical economy price`,
      `Airline: ${price.airline} | Stops: ${price.stops} | Duration: ${Math.round(price.duration_minutes / 60)}h`,
    ].join('\n')
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set — skipping email')
      return
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'alerts@flightprestige.com',
        to,
        subject,
        text: body,
      }),
    })

    if (!res.ok) {
      console.error('Email send failed:', await res.text())
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM_PHONE

    if (!sid || !token || !from) {
      console.warn('Twilio not configured — skipping SMS')
      return
    }

    const credentials = Buffer.from(`${sid}:${token}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    })

    if (!res.ok) {
      console.error('SMS send failed:', await res.text())
    }
  }

  async notifyUser(
    user: IUser,
    alert: IAlert,
    price: IPrice,
    route: IRoute,
    baseline: number,
  ): Promise<void> {
    const message = this.formatDealMessage(alert, price, route, baseline)
    const subject = `${alert.level} Deal: ${route.origin} → ${route.destination} at €${price.price}`

    const tasks: Promise<void>[] = []

    if (user.notify_email && user.email) {
      tasks.push(this.sendEmail(user.email, subject, message))
    }

    if (user.notify_sms && user.phone) {
      tasks.push(this.sendSms(user.phone, message))
    }

    await Promise.all(tasks)
    await this.markAlertSent(alert.id)
  }

  async getUsersForRoute(routeId: string): Promise<IUser[]> {
    const { rows } = await query<IUser>(`
      SELECT u.*
      FROM users u
      JOIN routes r ON r.user_id = u.id
      WHERE r.id = $1
    `, [routeId])
    return rows
  }
}

export const notificationService = new NotificationService()
