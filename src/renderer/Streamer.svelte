<script>
  import "./global.css";
  import CopyClipboard from "./CopyClipboard.svelte";
  import io from "socket.io-client";

  let isStreaming = false;
  let output = "";
  let microphone;
  let socket;

  async function getMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,          // Mono audio
          sampleRate: 16000,        // 16kHz sample rate
          sampleSize: 16,           // 16-bit samples
          echoCancellation: true,   // Enable echo cancellation
          noiseSuppression: true    // Enable noise suppression
        } 
      });
      
      return new MediaRecorder(stream, { 
        mimeType: "audio/webm",
        audioBitsPerSecond: 128000
      });
    } catch (error) {
      console.error("error accessing microphone:", error);
      throw error;
    }
  }

  async function setupSocket() {
    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      reconnectionAttempts: 5
    });
    
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("transcript", (data) => {
      console.log("Received transcript:", data);
      if (data && typeof data === 'string') {
        output = data;
      }
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      isStreaming = false;
    });
  }

  async function startStreaming() {
    try {
      if (!socket) {
        await setupSocket();
      }
      
      microphone = await getMicrophone();
      
      microphone.ondataavailable = async (event) => {
        if (event.data.size > 0 && socket && socket.connected) {
          try {
            // Create a blob with specific type
            const audioBlob = new Blob([event.data], { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Send the raw binary data
            socket.emit('packet-sent', arrayBuffer);
            console.log('Audio data sent to server, size:', arrayBuffer.byteLength);
          } catch (error) {
            console.error('Error processing audio data:', error);
          }
        }
      };

      // Send smaller chunks more frequently
      microphone.start(500);
      isStreaming = true;
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  }

  async function stopStreaming() {
    if (microphone) {
      microphone.stop();
      microphone = undefined;
    }
    if (socket) {
      socket.disconnect();
      socket = undefined;
    }
    isStreaming = false;
    output = "";
  }
</script>

<div>
  <button
    class={isStreaming ? 'recording' : ''}
    on:click={isStreaming ? stopStreaming : startStreaming}
  >
    {isStreaming ? "Stop Recording" : "Start Recording"}
  </button>
  <CopyClipboard textToCopy={isStreaming ? '' : output} />
  <p>{output}</p>
</div>

<style>
  div {
    text-align: center;
    max-width: 100%;
  }

  button {
    margin: 10px;
    padding: 10px 20px;
    border-radius: 4px;
    border: none;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #45a049;
  }

  button.recording {
    background-color: #f44336;
  }

  button.recording:hover {
    background-color: #da190b;
  }

  p {
    font-family: "Courier New", Courier, monospace;
    margin: 0 20px;
    margin-top: 10px;
    min-height: 1em;
  }
</style>
