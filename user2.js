const amqp = require('amqplib');
const readline = require('readline');

async function startUser2() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const exchange = 'direct_exchange';
  const queue = 'user2_queue';

  await channel.assertExchange(exchange, 'direct', { durable: false });
  await channel.assertQueue(queue, { durable: false });
  await channel.bindQueue(queue, exchange, 'user1_key');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  async function sendMessage() {
    rl.question('Send message to user1 (or "exit" to quit): ', async (message) => {
      if (message.trim().toLowerCase() === 'exit') {
        rl.close();
        await connection.close();
        process.exit(0);
      } else {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[User1 Recived Message][${timestamp}]: ${message}`);
        channel.publish(exchange, 'user2_key', Buffer.from(message));
        await sendMessage();
      }
    });
  }

  async function receiveMessage() {
    channel.consume(queue, (message) => {
      readline.cursorTo(process.stdout, 0); // Move cursor to beginning of line
      readline.clearLine(process.stdout, 1); // Clear line
      const timestamp = new Date().toLocaleTimeString();
      console.log(`Msg received from User1 [${timestamp}]: ${message.content.toString()}`);
      rl.prompt(true); // Re-print the prompt
    }, { noAck: true });
  }

  await Promise.all([sendMessage(), receiveMessage()]);
}

startUser2().catch(console.error);
