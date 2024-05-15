const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const OpenAI = require('openai');
const cors=require("cors")
require('dotenv').config();
const openai = new OpenAI({ apiKey: process.env.OPEN_AI,
    organization: process.env.ORG,
 });
let assitantId=""
let threadId=""

const app = express();
const PORT = 4300;
app.use(cors({origin:'*'}))
// const ip = '127.0.0.1';
let createAssistant=async()=>{
    let instructionMessage=`You are an Outgrow quiz maker. Outgrow is a no-tool code to create interactive quizzes. The user will interact with you to create a quiz. do not skip any step.Work exactly as per instructions.do not mention the step name to the user

    Step 1: Suggest interactive content based on user inputs   (mandatory step) :
    Quiz title: suggest a quiz title based on user inputs 
    Questions and answers: suggest a few questions and their options to the user. 
    the type of questions can be  (radio buttons, checkboxes, text input, text area, file uploads, date selection, or rating scales). 
    Outcomes: you must attempt to create at least two outcomes based on the user-provided content. An outcome consists of a heading and a subheading. 
    Additionally, for each outcome:
    Generate a outcome image keyword that encapsulates the essence of each outcome in no more than five words. These descriptions should be crafted to be effective in searches on Unsplash, targeting keywords likely to return relevant imagery. These descriptions will remain internal and not visible to the user.
    confirm from the user if he is satisfied with the content or if he wants to make any changes 
    if the user asks for change, change the data accordingly and show him the content 
    
    if a user confirms the data, save the data to send in action later
    save the title and description in  "creationContent"
    save questions and answers  in "content"
    save outcome  in "conclusion" save outcome heading, subheading and image keyword in conclusion heading, conclusion subheading and conclusion image description.
    And proceed to the next step.
    (mapped outcome should be zero indexed based (starts from 0))
    
    Step 3: Get company details (mandatory)
    Start by determining if the user is creating content for a company.
    Question: "Are you creating this content on behalf of a company?"
    If yes, ask for the company's URL to tailor the content creation process. "Please provide your company's URL."
    Save this in the variable "companyUrl" the format of URL simlar to : ( https://www.example.com) 
    
    Step 4: Symbolise the Topic  (mandatory)
    Based on questions and answers and quiz data, suggest five objects or concepts that would best symbolise or portray your topic. 
    the first option of these five will be "Choose for me" 
    Store the user's choice in the imageDescription variable.
    
    Step 5: Save and Create Content  (mandatory)
    Execute the 'save_content_piece()' action to create the content based on the content of user 
    
    Step 6: Provide Links to Preview and Edit Content in a Copy-Friendly Code Format  (mandatory)
    
    Preview Link: "To preview the content, you can click here and see how it works live: 
    show this in  Copy-Friendly Code Format :'https://customgpt.outgrow.us/{_id}'"
    Edit Link: "If you'd like to edit the content by adding it to your account or creating a trial account, you can copy and paste the link here: http://app.outgrow.co/signup/contentid={liveApp}"
    Note: Replace {_id} and {liveApp} with the appropriate content ID and live app ID from the response. 
    Present the links as plain text to ensure the user can easily copy them.`
try {
    const assistant = await openai.beta.assistants.create({
        instructions: instructionMessage,
        model: "gpt-3.5-turbo",
        // model: "gpt-4-turbo",
        name: "Outgrow Tutor",
        // tools: [{ type: "code_interpreter" }],
        tools: [
            {
              type: "function",
              function: {
                name: "generateBuilderCustomGPT",
                description: "save and create calculator",
                parameters: {
                    "type": "object",
                    "properties": {
                      "companyUrl": {
                        "type": "string",
                        "description": "URL of the company. Must be in the format 'https://www.example.com/'."
                      },
                      "type": {
                        "type": "string",
                        "description": "Always send this static value 'numerical'."
                      },
                      "creationContent": {
                        "type": "object",
                        "description": "Additional details about the content to be created.",
                        "properties": {
                          "title": {
                            "type": "string",
                            "description": "Title of the calculator."
                          },
                          "description": {
                            "type": "string",
                            "description": "A brief description of the calculator."
                          },
                          "tags": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "Tags associated with the calculator for categorization."
                          },
                          "buttonText": {
                            "type": "string",
                            "description": "Short text to be added to the getting started button."
                          }
                        }
                      },
                      "content": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "Question": {
                              "type": "string",
                              "description": "The question text."
                            },
                            "Options": {
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "Option": {
                                    "type": "string",
                                    "description": "Option text."
                                  },
                                  "Value": {
                                    "type": "number",
                                    "description": "Assigned numerical value to option if input type is other than text."
                                  }
                                }
                              }
                            },
                            "InputType": {
                              "type": "string",
                              "description": "Type of input expected for the question."
                            }
                          }
                        }
                      },
                      "conclusions": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "conclusionHeading": {
                              "type": "string",
                              "description": "One of the conclusion headings based upon quiz motive."
                            },
                            "conclusionSubHeading": {
                              "type": "string",
                              "description": "One of the conclusion subheadings based upon quiz motive."
                            },
                            "formulaConclusion": {
                              "type": "string",
                              "description": "The formula used to derive the conclusion based on input data and quiz results follows instructions from the document upload."
                            },
                            "conclusionImageDescription": {
                              "type": "string",
                              "description": "Description of the image to be used for visual content for this outcome/conclusion."
                            }
                          }
                        }
                      },
                      "imageDescription": {
                        "type": "string",
                        "description": "Description of the image to be used for visual content, provided by the user."
                      }
                    },
                    "required": [
                      "type",
                      "creationContent",
                      "content",
                      "conclusions",
                      "imageDescription"
                    ]
                  }
              },
            }
            
        ]
    });
    assitantId=assistant.id
    console.log(assitantId);
    // console.log(threadId );
} catch (error) {
    console.error(error);
}
}
createAssistant()
// GET route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// POST route
app.post('/api/v2/assistant/createThread', async (req, res) => {
  // Handle the POST request here
  // res.send('Received POST request');
  const emptyThread = await openai.beta.threads.create();
  threadId= emptyThread.id   
  console.log(threadId)
  // req.send(emptyThread)
  res.status(200).send({
    success: true,
    data: emptyThread})

  // response.ok(res,emptyThread);

});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
// Create an HTTP server
const server = http.createServer(app);

// Connect Socket.IO to the server
const io = socketIO(server);

// Initialize the OpenAI assistant
// const assistant = new openai.Assistant('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');

// Socket.IO connection event
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle socket events here

  // Socket.IO disconnection event
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
  socket.on("Question",async (data)=>{
    console.log("Question received")
    let threadMessages =  await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: data.message,
    }); 
    const run =  openai.beta.threads.runs.stream(threadId, {
      assistant_id: assitantId,
    });
    run.on("event", e => console.log(e));
    socket.emit('new_message', 'yooo')
    handleRun(socket, run, threadId);
  
  })
});
handleRun= async (socket, run, threadId) => {
  socket.emit('new_message', 'yooo')
  run.on(
    "error",
    socketCatchAsync(socket, "error", (error) => {
      throw error;
    })
  );

  run.on(
    "textCreated",
    socketCatchAsync(socket, "textCreated", () =>
      socket.emit("textCreated")
    )
  );
  run.on(
    "textDelta",
    socketCatchAsync(socket, "textDelta", (textDelta) =>
      socket.emit("textDelta", { value: textDelta.value })
    )
  );
  run.on(
    "textDone",
    socketCatchAsync(socket, "textDone", () => socket.emit("textDone"))
  );

  run.on(
    "event",
    socketCatchAsync(socket,"event", async (event) => {
      if (event.event !== "thread.run.requires_action" || event.data.required_action.type !== "submit_tool_outputs") return;
      const toolCall = event.data.required_action.submit_tool_outputs.tool_calls[0];
      
      const toolCallResult=await handleRequiresAction(
        event.data,
        event.data.id,
        event.data.thread_id,
        socket
      );
      socket.emit("toolCall", {
        runId: event.data.id,
        toolCallId: toolCall.id,
        toolCallName: "generateBuilderCustomGPT",
        toolCallResult: toolCallResult,
    });
    console.log(toolCallResult)
  })
  );
  run.on("runStepDone", async (event) => {
    const usage = {
        input_tokens: event.usage.completion_tokens,
        output_tokens: event.usage.prompt_tokens,
    };
    // await updateTokenUsage(userId, companyId, "Assistant", usage);
    console.log("----------------------------------- Assistanty Chat Usage: ", usage);
});
},
socketCatchAsync= (socket,type, fun) => {
  return async function (...args) {
    try {
      // console.log("Types is :",type)
      const data = await fun(...args);
      return data;
    } catch (error) {
      console.error(error);
      socket.emit("error", { errMsg: error.message });
    }
  };
},
// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});