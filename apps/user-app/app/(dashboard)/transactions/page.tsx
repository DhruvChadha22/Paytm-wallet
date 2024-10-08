import prisma from "@repo/db/client";
import { OnRampTransactions } from "../../../components/OnRampTransactions";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { P2PTransactions } from "../../../components/P2PTransactions";

type OnRampTxns = {
    status: "Success" | "Failure" | "Processing";
    provider: string;
    amount: number;
    startTime: Date;
}[];

type P2PTxns = {
    amount: number;
    timestamp: Date;
    fromUserId: number;
}[];

async function getOnRampTransactions() {
    const session = await getServerSession(authOptions);
    const txns: OnRampTxns = await prisma.onRampTransaction.findMany({
        where: {
            userId: Number(session?.user?.id)
        }
    });

    return txns.map(t => ({
        time: t.startTime,
        amount: t.amount,
        status: t.status,
        provider: t.provider
    }))
}

async function getP2PTransactions() {
    const session = await getServerSession(authOptions);
    const txns: P2PTxns = await prisma.p2pTransfer.findMany({
        where: {
            toUserId: Number(session?.user?.id)
        }
    });

    return txns.map(t => ({
        time: t.timestamp,
        amount: t.amount,
        from: t.fromUserId
    }))
}


export default async function() {
    const onRampTxns = await getOnRampTransactions();
    const p2pTxns = await getP2PTransactions();

    return <div className="w-screen">
        <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">
            Transactions
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4 mb-8">
            <div>
                <OnRampTransactions transactions={onRampTxns}/>
            </div>
            <div>
                <P2PTransactions transactions={p2pTxns} />
            </div>
        </div>
    </div>
}
