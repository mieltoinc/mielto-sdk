/**
 * Browser-based test application for Mielto SDK
 * 
 * This file handles all form interactions and API calls
 */

import { Mielto } from '../../src/index';

// Initialize client (will be set when API key is provided)
let client: Mielto | null = null;

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    if (!tabName) return;

    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    tab.classList.add('active');
    const content = document.getElementById(tabName);
    if (content) {
      content.classList.add('active');
    }
  });
});

// Initialize client when API key is entered
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
apiKeyInput.addEventListener('change', () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    client = new Mielto({ apiKey });
    console.log('Client initialized');
  }
});

function getClient(): Mielto {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    throw new Error('Please enter your API key');
  }
  if (!client || apiKey !== apiKeyInput.value) {
    client = new Mielto({ apiKey });
  }
  return client;
}

function showResponse(elementId: string, data: any, isError: boolean = false) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.classList.add('show');
  element.className = `response-section show ${isError ? 'error' : 'success'}`;
  
  const content = element.querySelector('.response-content');
  if (content) {
    content.textContent = JSON.stringify(data, null, 2);
  } else {
    const h3 = document.createElement('h3');
    h3.textContent = isError ? 'Error' : 'Response';
    const div = document.createElement('div');
    div.className = 'response-content';
    div.textContent = JSON.stringify(data, null, 2);
    element.innerHTML = '';
    element.appendChild(h3);
    element.appendChild(div);
  }
}

function setButtonLoading(button: HTMLButtonElement, loading: boolean) {
  if (loading) {
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span>Processing...';
  } else {
    button.disabled = false;
    const originalText = button.getAttribute('data-original-text') || 'Submit';
    button.textContent = originalText;
  }
}

// Chat Form
const chatForm = document.getElementById('chatForm') as HTMLFormElement;
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = chatForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  button.setAttribute('data-original-text', button.textContent || 'Send Message');
  setButtonLoading(button, true);

  try {
    const client = getClient();
    const model = (document.getElementById('chatModel') as HTMLSelectElement).value;
    const systemMessage = (document.getElementById('chatSystem') as HTMLTextAreaElement).value;
    const userMessage = (document.getElementById('chatMessage') as HTMLTextAreaElement).value;
    const stream = (document.getElementById('chatStream') as HTMLInputElement).checked;

    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    messages.push({ role: 'user', content: userMessage });

    if (stream) {
      const response = await client.chat.completions.create({
        model,
        messages,
        stream: true,
      });

      if (Symbol.asyncIterator in response) {
        let fullResponse = '';
        const responseDiv = document.getElementById('chatResponse');
        if (responseDiv) {
          responseDiv.classList.add('show', 'success');
          responseDiv.innerHTML = '<h3>Streaming Response</h3><div class="response-content"></div>';
          const contentDiv = responseDiv.querySelector('.response-content') as HTMLElement;
          
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = typeof content === 'string' ? content : JSON.stringify(content);
              fullResponse += text;
              contentDiv.textContent = fullResponse;
            }
          }
        }
      }
    } else {
      const response = await client.chat.completions.create({
        model,
        messages,
        stream: false,
      });

      if ('choices' in response) {
        showResponse('chatResponse', {
          message: response.choices[0]?.message?.content,
          usage: response.usage,
          model: response.model,
        });
      }
    }
  } catch (error: any) {
    showResponse('chatResponse', {
      error: error.message,
      details: error.responseData || error.statusCode,
    }, true);
  } finally {
    setButtonLoading(button, false);
  }
});

// Memories Form
const memoriesForm = document.getElementById('memoriesForm') as HTMLFormElement;
memoriesForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = memoriesForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  button.setAttribute('data-original-text', button.textContent || 'Create Memory');
  setButtonLoading(button, true);

  try {
    const client = getClient();
    const userId = (document.getElementById('memoryUserId') as HTMLInputElement).value;
    const memory = (document.getElementById('memoryContent') as HTMLTextAreaElement).value;
    const topicsStr = (document.getElementById('memoryTopics') as HTMLInputElement).value;
    const topics = topicsStr ? topicsStr.split(',').map(t => t.trim()) : undefined;

    const result = await client.memories.create({
      user_id: userId,
      memory,
      topics,
    });

    showResponse('memoriesResponse', {
      success: true,
      memory_id: result.memory_id,
      memory: result.memory,
      topics: result.topics,
    });
  } catch (error: any) {
    showResponse('memoriesResponse', {
      error: error.message,
      details: error.responseData || error.statusCode,
    }, true);
  } finally {
    setButtonLoading(button, false);
  }
});

// Memory Search Form
const memorySearchForm = document.getElementById('memorySearchForm') as HTMLFormElement;
memorySearchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = memorySearchForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  button.setAttribute('data-original-text', button.textContent || 'Search');
  setButtonLoading(button, true);

  try {
    const client = getClient();
    const query = (document.getElementById('memorySearchQuery') as HTMLInputElement).value;
    const userId = (document.getElementById('memorySearchUserId') as HTMLInputElement).value;

    const result = await client.memories.search({
      query,
      user_id: userId,
      limit: 10,
    });

    showResponse('memoriesResponse', {
      success: true,
      total_results: result.total_results,
      memories: result.memories.map(m => ({
        memory_id: m.memory_id,
        memory: m.memory,
        topics: m.topics,
      })),
    });
  } catch (error: any) {
    showResponse('memoriesResponse', {
      error: error.message,
      details: error.responseData || error.statusCode,
    }, true);
  } finally {
    setButtonLoading(button, false);
  }
});

// Collection Create Form
const collectionCreateForm = document.getElementById('collectionCreateForm') as HTMLFormElement;
collectionCreateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = collectionCreateForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  button.setAttribute('data-original-text', button.textContent || 'Create Collection');
  setButtonLoading(button, true);

  try {
    const client = getClient();
    const name = (document.getElementById('collectionName') as HTMLInputElement).value;
    const description = (document.getElementById('collectionDescription') as HTMLTextAreaElement).value;

    const result = await client.collections.create({
      name,
      description: description || undefined,
    });

    // Update collection ID input for insert form
    const collectionIdInput = document.getElementById('collectionId') as HTMLInputElement;
    if (collectionIdInput) {
      collectionIdInput.value = result.id;
    }

    showResponse('collectionsResponse', {
      success: true,
      collection_id: result.id,
      name: result.name,
      description: result.description,
    });
  } catch (error: any) {
    showResponse('collectionsResponse', {
      error: error.message,
      details: error.responseData || error.statusCode,
    }, true);
  } finally {
    setButtonLoading(button, false);
  }
});

// Collection Insert Form
const collectionInsertForm = document.getElementById('collectionInsertForm') as HTMLFormElement;
collectionInsertForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = collectionInsertForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  button.setAttribute('data-original-text', button.textContent || 'Insert');
  setButtonLoading(button, true);

  try {
    const client = getClient();
    const collectionId = (document.getElementById('collectionId') as HTMLInputElement).value;
    const content = (document.getElementById('collectionContent') as HTMLTextAreaElement).value;
    const label = (document.getElementById('collectionLabel') as HTMLInputElement).value;
    const fileInput = document.getElementById('collectionFile') as HTMLInputElement;

    let result;
    if (fileInput.files && fileInput.files.length > 0) {
      // Handle file upload
      const file = fileInput.files[0];
      result = await client.collections.insert({
        collection_id: collectionId,
        file,
        label: label || file.name,
        ingest: true,
      });
    } else if (content) {
      // Handle text content
      result = await client.collections.insert({
        collection_id: collectionId,
        content,
        label: label || 'Text Content',
        ingest: true,
      });
    } else {
      throw new Error('Please provide either content or a file');
    }

    showResponse('collectionsResponse', {
      success: true,
      status: result.status,
      successful_uploads: result.successful_uploads,
      contents: result.contents,
    });
  } catch (error: any) {
    showResponse('collectionsResponse', {
      error: error.message,
      details: error.responseData || error.statusCode,
    }, true);
  } finally {
    setButtonLoading(button, false);
  }
});

// Collection Search Form
const collectionSearchForm = document.getElementById('collectionSearchForm') as HTMLFormElement;
collectionSearchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = collectionSearchForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  button.setAttribute('data-original-text', button.textContent || 'Search');
  setButtonLoading(button, true);

  try {
    const client = getClient();
    const collectionId = (document.getElementById('collectionSearchId') as HTMLInputElement).value;
    const query = (document.getElementById('collectionSearchQuery') as HTMLInputElement).value;

    const result = await client.collections.search({
      collection_id: collectionId,
      query,
      k: 10,
    });

    showResponse('collectionsResponse', {
      success: true,
      total_results: result.total_results,
      results: result.results.map(r => ({
        content: r.content.substring(0, 200) + '...',
        score: r.score,
        metadata: r.metadata,
      })),
    });
  } catch (error: any) {
    showResponse('collectionsResponse', {
      error: error.message,
      details: error.responseData || error.statusCode,
    }, true);
  } finally {
    setButtonLoading(button, false);
  }
});

// Compress Form
const compressForm = document.getElementById('compressForm') as HTMLFormElement;
compressForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = compressForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  button.setAttribute('data-original-text', button.textContent || 'Compress');
  setButtonLoading(button, true);

  try {
    const client = getClient();
    const content = (document.getElementById('compressContent') as HTMLTextAreaElement).value;
    const includeMetadata = (document.getElementById('compressMetadata') as HTMLInputElement).checked;

    const result = await client.compress.compress({
      content,
      include_metadata: includeMetadata,
    });

    const compressionRatio = result.original_length && result.compressed_length
      ? (result.compressed_length / result.original_length).toFixed(2)
      : 'N/A';

    showResponse('compressResponse', {
      success: true,
      original_length: result.original_length,
      compressed_length: result.compressed_length,
      compression_ratio: compressionRatio,
      compression_time: result.compression_time,
      status: result.status,
    });
  } catch (error: any) {
    showResponse('compressResponse', {
      error: error.message,
      details: error.responseData || error.statusCode,
    }, true);
  } finally {
    setButtonLoading(button, false);
  }
});

