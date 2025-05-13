const nodemailer = require('nodemailer');
const User = require('../models/User');
const Exhibition = require('../models/Exhibition');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      // Configure your email service here
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send exhibition reminder
  async sendExhibitionReminder(userId, exhibitionId) {
    try {
      const user = await User.findById(userId);
      const exhibition = await Exhibition.findById(exhibitionId);

      if (!user || !exhibition) {
        throw new Error('User or Exhibition not found');
      }

      const emailContent = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Reminder: ${exhibition.title} is coming up!`,
        html: `
          <h2>Exhibition Reminder</h2>
          <p>Dear ${user.name},</p>
          <p>This is a reminder that the exhibition "${exhibition.title}" is coming up on ${exhibition.startDate}.</p>
          <p>Location: ${exhibition.venue}</p>
          <p>Time: ${exhibition.time}</p>
          <p>We look forward to seeing you there!</p>
        `
      };

      await this.transporter.sendMail(emailContent);
      return true;
    } catch (error) {
      console.error('Failed to send exhibition reminder:', error);
      throw error;
    }
  }

  // Schedule reminders for upcoming exhibitions
  async scheduleExhibitionReminders() {
    try {
      const upcomingExhibitions = await Exhibition.find({
        startDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      });

      for (const exhibition of upcomingExhibitions) {
        const registeredUsers = await User.find({
          'registeredExhibitions': exhibition._id
        });

        for (const user of registeredUsers) {
          await this.sendExhibitionReminder(user._id, exhibition._id);
        }
      }
    } catch (error) {
      console.error('Failed to schedule exhibition reminders:', error);
      throw error;
    }
  }

  // Send immediate notification for exhibition updates
  async notifyExhibitionUpdate(exhibitionId, updateType) {
    try {
      const exhibition = await Exhibition.findById(exhibitionId);
      const registeredUsers = await User.find({
        'registeredExhibitions': exhibitionId
      });

      const updateMessages = {
        'cancelled': 'has been cancelled',
        'rescheduled': 'has been rescheduled',
        'updated': 'has been updated'
      };

      for (const user of registeredUsers) {
        const emailContent = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Exhibition Update: ${exhibition.title}`,
          html: `
            <h2>Exhibition Update</h2>
            <p>Dear ${user.name},</p>
            <p>The exhibition "${exhibition.title}" ${updateMessages[updateType]}.</p>
            <p>Please check the exhibition page for more details.</p>
          `
        };

        await this.transporter.sendMail(emailContent);
      }
    } catch (error) {
      console.error('Failed to send exhibition update notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 