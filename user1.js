const amqp = require('amqplib');
const readline = require('readline');

async function startUser1() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const exchange = 'direct_exchange';
  const queue = 'user1_queue';

  await channel.assertExchange(exchange, 'direct', { durable: false });
  await channel.assertQueue(queue, { durable: false });
  await channel.bindQueue(queue, exchange, 'user2_key');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  async function sendMessage() {
    rl.question('Send message to user2 (or "exit" to quit): ', async (message) => {
      if (message.trim().toLowerCase() === 'exit') {
        rl.close();
        await connection.close();
        process.exit(0);
      } else {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[User1][${timestamp}]: ${message}`);
        channel.publish(exchange, 'user1_key', Buffer.from(message));
        await sendMessage();
      }
    });
  }

  async function receiveMessage() {
    channel.consume(queue, (message) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`Msg received from User2 [${timestamp}]: ${message.content.toString()}`);
    }, { noAck: true });
  }

  await Promise.all([sendMessage(), receiveMessage()]);
}

startUser1().catch(console.error);
