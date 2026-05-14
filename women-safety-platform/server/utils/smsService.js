/**
 * SMS Service — Simulated
 * Replace with Twilio or other SMS provider in production
 */

class SMSService {
  static async sendSOS(contacts, userName, location) {
    const message = `🚨 EMERGENCY SOS from ${userName}! They need immediate help. Location: https://www.openstreetmap.org/?mlat=${location.coordinates[1]}&mlon=${location.coordinates[0]}#map=17/${location.coordinates[1]}/${location.coordinates[0]}`;

    for (const contact of contacts) {
      console.log(`📱 [SMS SIMULATION] To: ${contact.phone} (${contact.name})`);
      console.log(`   Message: ${message}`);
      console.log('---');
    }

    return {
      success: true,
      sent: contacts.length,
      message: 'SMS alerts sent (simulated)'
    };
  }

  static async sendAlert(phone, message) {
    console.log(`📱 [SMS SIMULATION] To: ${phone}`);
    console.log(`   Message: ${message}`);
    return { success: true };
  }

  static async sendResolved(contacts, userName) {
    const message = `✅ ${userName}'s emergency has been resolved. They are safe now.`;
    
    for (const contact of contacts) {
      console.log(`📱 [SMS SIMULATION] To: ${contact.phone} (${contact.name})`);
      console.log(`   Message: ${message}`);
    }

    return { success: true, sent: contacts.length };
  }
}

module.exports = SMSService;
