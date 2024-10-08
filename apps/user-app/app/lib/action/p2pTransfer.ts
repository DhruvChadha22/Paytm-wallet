"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";
import { Prisma } from "@prisma/client";

export async function p2pTransfer(phone: string, amount: number) {
    const session = await getServerSession(authOptions);
    const from = session?.user?.id;

    if (!from) {
        return {
            message: "Unauthenticated request"
        }
    }

    const to = await prisma.user.findFirst({
        where: {
            number: phone
        }
    });
    
    if (!to) {
        return {
            message: "User NOT Found"
        }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;

        const fromBalance = await prisma.balance.findFirst({
            where: {
                userId: Number(from)
            }
        });

        if (!fromBalance || fromBalance.amount < amount) {
            throw new Error("Insufficient Funds!");
        }

        await tx.balance.update({
            where: {
                userId: Number(from)
            },
            data: {
                amount: {
                    decrement: amount
                }
            }
        });

        await tx.balance.update({
            where: {
                userId: to.id
            },
            data: {
                amount: {
                    increment: amount
                }
            }
        });

        await tx.p2pTransfer.create({
            data: {
                amount: amount,
                timestamp: new Date(),
                fromUserId: Number(from),
                toUserId: to.id
            }
        });
    });
}
