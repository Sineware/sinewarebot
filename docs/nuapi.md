# SinewareBot NuAPI

## Comment Datatypes
* *id: string representing Discord snowflake (ID)

## NuClient Functions
src/services/nuapi/api.js exports a NuClient object (functions are async/return a promise):
* connectDiscord(): Starts NuClient by connecting to the Discord Gateway and registering handlers\
* callAPI(endpoint, payload): Raw access to the Discord REST API (do not use)
* createMessage(content, channelid): Send a message with string content to channelid (string)
* createReplyMessage(content, channelid, msgid): Send a message with string content to channelid (string) replying to msgid
* eventEmitter: Event emitter object, events:
    * .on("connected" (resumed)=>{}): Fired when connectDiscord() successfully identifies with the Gateway. resumed is a bool 
    on whether the connection is a new session or was resumed from a session ID.