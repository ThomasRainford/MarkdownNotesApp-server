import { ObjectType } from "type-graphql";
import { MessageSentResponse } from "./MessageSentResponse";

@ObjectType()
export class MessageSentPayload extends MessageSentResponse {}
