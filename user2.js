const amqp = require('amqplib');
const readline = require('readline');

async function startSubscriber() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const exchange = 'direct_exchange';
  const queue = 'subscriber_queue';

  await channel.assertExchange(exchange, 'direct', { durable: false });
  await channel.assertQueue(queue, { durable: false });
  await channel.bindQueue(queue, exchange, 'publisher_key');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.setPrompt('Enter message for publisher (or "exit" to quit): ');
  rl.prompt();

  rl.on('line', async (input) => {
    if (input.trim().toLowerCase() === 'exit') {
      rl.close();
      await connection.close();
      process.exit(0);
    } else {
      const message = input.trim();
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[You][${timestamp}]: ${message}`);
      channel.publish(exchange, 'subscriber_key', Buffer.from(message));
      rl.prompt();
    }
  });

  // Listen for messages from publisher
  channel.consume(queue, (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Publisher][${timestamp}]: ${message.content.toString()}`);
  }, { noAck: true });
}

startSubscriber().catch(console.error);
