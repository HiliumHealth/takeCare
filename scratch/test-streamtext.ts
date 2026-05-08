
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

async function test() {
  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt: 'Hello',
  });
  
  console.log('Keys without await:', Object.keys(result));
  console.log('toDataStreamResponse type:', typeof (result as any).toDataStreamResponse);

  const awaitedResult = await streamText({
    model: google('gemini-2.5-flash'),
    prompt: 'Hello',
  });
  
  console.log('Keys with await:', Object.keys(awaitedResult));
  console.log('toDataStreamResponse type (awaited):', typeof (awaitedResult as any).toDataStreamResponse);
}

test().catch(console.error);
