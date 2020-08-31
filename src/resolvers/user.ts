import {
    Resolver,
    Mutation,
    Arg,
    InputType,
    Field,
    Ctx,
    ObjectType,
	Query,
} from "type-graphql";
import argon2 from "argon2";
import { MyContext } from "../types";
import { User } from "../entities/User";

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em }: MyContext
    ) {
		if (options.username.length <= 2) {
			return {
				errors: [
					{
						field: 'username',
						message: "Username is too short"
					}
				]
			}
		}

		if (options.password.length <= 3) {
			return {
				errors: [
					{
						field: 'password',
						message: "Password is too short"
					}
				]
			}
		}
        const hashedPW = await argon2.hash(options.password);
        const user = em.create(User, {
            username: options.username,
            password: hashedPW,
		});
	
		try {
			await em.persistAndFlush(user);
		} catch (err) { 
			console.log(err);
			if (err.code === "23505") {
				return {
					errors: [{
						field: 'username',
						message: 'Username already taken'
					}]
				}
			}
		}

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em }: MyContext
    ) {
        const user = await em.findOne(User, { username: options.username });
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Username does not exist"
                    },
                ],
            };
        }
        const validPW = await argon2.verify(user.password, options.password);
        if (!validPW) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Incorrect password entered"
                    },
                ],
            };
        }

        return { user };
	}
	
	@Query(() => [User])
	async getUsers(
		@Ctx() { em }: MyContext
	) {
		const users = await em.find(User, {});
		return users;
	}
}
