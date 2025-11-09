// server/models/index.js

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// -------------------------------------
// Initialize Sequelize Connection
// -------------------------------------
const sequelize = new Sequelize(
  process.env.DB_URL || 'mysql://root:@localhost:3306/afyalink_db',
  {
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

// -------------------------------------
// Import Models
// -------------------------------------
// (keeps your existing model files unchanged)
const HealthService = require('./HealthService');
const Admin = require('./Admin');
const User = require('./User');
const ChatSession = require('./ChatSession');
const ChatMessage = require('./ChatMessage');

// -------------------------------------
// Define Associations
// -------------------------------------
// Guard against double-definition if this file is reloaded
if (!User.associations || !User.associations.chatSessions) {
  // 🧍 User ↔ ChatSession
  User.hasMany(ChatSession, { foreignKey: 'userId', as: 'chatSessions' });
  ChatSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
}

if (!User.associations || !User.associations.sentMessages) {
  // 🧍 User ↔ ChatMessage
  User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
}

if (!ChatSession.associations || !ChatSession.associations.sessionMessages) {
  // 💬 ChatSession ↔ ChatMessage
  ChatSession.hasMany(ChatMessage, { foreignKey: 'sessionId', as: 'sessionMessages' });
  ChatMessage.belongsTo(ChatSession, { foreignKey: 'sessionId', as: 'chatSession' });
}

// -------------------------------------
// Test Connection & Sync Models
// -------------------------------------
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message || error);
  }
};

const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true }); // safe schema update in development
    console.log('✅ Models synchronized successfully.');
  } catch (error) {
    console.error('❌ Model synchronization failed:', error.message || error);
  }
};

// Initialize connection
testConnection();
syncModels();

// -------------------------------------
// Export Models and Sequelize
// -------------------------------------
module.exports = {
  sequelize,
  HealthService,
  Admin,
  User,
  ChatSession,
  ChatMessage,
};
