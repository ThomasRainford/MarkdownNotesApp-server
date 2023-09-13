import { ChatRoom } from "../entities/ChatRoom";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { OrmContext } from "../types/types";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { ChatRoomResponse } from "./object-types/ChatRoomResponse";
import { CreateChatRoomInput } from "./input-types/CreateChatRoomInput";

@Resolver(ChatRoom)
export class ChatRoomResolver {
  @Query(() => ChatRoomResponse)
  @UseMiddleware(isAuth)
  async chatRoom(
    @Arg("chatRoomId") chatRoomId: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatRoomResponse> {
    const userRepo = em.getRepository(User);
    const chatRoomRepo = em.getRepository(ChatRoom);
    const chatRoom = await chatRoomRepo.findOne(
      {
        id: chatRoomId,
      },
      ["members", "messages"]
    );
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatRooms",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    // Check if authenticated user is a member of the chat room.
    if (!chatRoom?.members.contains(me)) {
      return {
        error: {
          property: "chatRoom.members",
          message: "You are not a member of this chat room.",
        },
      };
    }
    // Check if ChatRoom exists.
    if (!chatRoom) {
      return {
        error: {
          property: "chatRoom",
          message: "ChatRoom does not exist.",
        },
      };
    }
    return { chatRoom };
  }

  @Query(() => [ChatRoom])
  @UseMiddleware(isAuth)
  async chatRooms(@Ctx() { em, req }: OrmContext): Promise<ChatRoom[]> {
    const chatRoomRepo = em.getRepository(ChatRoom);
    const chatRooms = await chatRoomRepo.findAll({
      populate: ["members", "messages"],
    });
    // Filter chatRooms by authenticated user in members.
    const userChatRooms = chatRooms.filter((cp) =>
      cp.members.getItems().find((u) => u._id.equals(req.session.userId || ""))
    );
    return userChatRooms;
  }

  @Mutation(() => ChatRoomResponse)
  @UseMiddleware(isAuth)
  async createChatRoom(
    @Arg("chatRoomInput") chatRoomInput: CreateChatRoomInput,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatRoomResponse> {
    const userRepo = em.getRepository(User);
    const { name, userIds } = chatRoomInput;
    // Check if userIds has length of at least 1.
    if (userIds.length === 0) {
      return {
        error: {
          property: "chatRoomInput.userIds",
          message: "At least 1 userId must be provided.",
        },
      };
    }
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatRooms",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    const users = await userRepo.find({ id: userIds });
    if (!users || users.length === 0) {
      return {
        error: {
          property: "chatRoomInput.userIds",
          message: "Cannot find any users to add to chat room.",
        },
      };
    }
    const chatRoom = new ChatRoom({ name, users });
    await em.populate(chatRoom, ["members", "messages"]);
    await em.persistAndFlush(chatRoom);

    return { chatRoom };
  }

  @Mutation(() => ChatRoomResponse)
  @UseMiddleware(isAuth)
  async updateChatRoom(
    @Arg("chatRoomId") chatRoomId: string,
    @Arg("name") name: string,
    @Ctx() { em, req }: OrmContext
  ): Promise<ChatRoomResponse> {
    const userRepo = em.getRepository(User);
    const chatRoomRepo = em.getRepository(ChatRoom);
    const chatRoom = await chatRoomRepo.findOne(
      {
        id: chatRoomId,
      },
      ["members", "messages"]
    );
    const me = await userRepo.findOne({ _id: req.session.userId }, [
      "chatRooms",
    ]);
    if (!me) {
      return {
        error: {
          property: "req.session.userId",
          message: "Please login.",
        },
      };
    }
    // Check if authenticated user is a member of the chat room.
    if (!chatRoom?.members.contains(me)) {
      return {
        error: {
          property: "chatRoom.members",
          message: "You are not a member of this chat room.",
        },
      };
    }
    // Check if ChatRoom exists.
    if (!chatRoom) {
      return {
        error: {
          property: "chatRoom",
          message: "ChatRoom does not exist.",
        },
      };
    }
    chatRoom.name = name;

    await em.persistAndFlush(chatRoom);

    return { chatRoom };
  }
}
