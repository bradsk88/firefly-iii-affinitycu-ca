import React from "react";
import {TransactionTypeProperty} from "firefly-iii-typescript-sdk-fetch";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";

const monthIndexes: { [key: string]: number } = {
    'Jan': 0,
    'Feb': 1,
    'Mar': 2,
    'Apr': 3,
    'May': 4,
    'Jun': 5,
    'Jul': 6,
    'Aug': 7,
    'Sep': 8,
    'Oct': 9,
    'Nov': 10,
    'Dec': 11,
}

export interface OpeningBalance {
    accountNumber: string;
    accountName: string;
    balance: number;
    date: Date;
}

async function scrapeOpeningBalance(
    account: PageAccount,
): Promise<OpeningBalance> {
    const table = document.querySelectorAll('div[aria-label="Transactions"] > div.table-body');
    const txs: Element = table.values().next().value;
    const txRows = txs.querySelectorAll('div.table-row');
    const allRows = Array.from(txRows.values());
    const row = allRows[allRows.length - 1];
    const date = row.children.item(0)!.textContent!.trim();
    const amount = row.children.item(2)!.textContent!.trim();
    const balance = row.children.item(3)!.textContent!.trim().replace('$', '').replace(',', '');

    const tType = amount.startsWith("-") ? TransactionTypeProperty.Withdrawal : TransactionTypeProperty.Deposit;

    const amt = amount.replace('$', '').replace(',', '');

    const dateParts = date.split(', ');
    const year = Number.parseInt(dateParts[1]);
    let dayParts = dateParts[0].split(' ');
    const monthPrf: string = dayParts[0].substring(0, 3);
    const month = monthIndexes[monthPrf];
    const day = Number.parseInt(dayParts[1]);

    const openingBalance = Number.parseFloat(balance) - (Number.parseFloat(amt) || 0);
    return {
        accountNumber: account.id,
        accountName: account.name,
        balance: openingBalance,
        date: new Date(year, month, day - 1, 23, 59, 59, 999),
    };
}

interface PageAccount {
    id: string;
    name: string;
}

async function getCurrentPageAccount(
    allAccounts: AccountRead[],
): Promise<PageAccount> {
    const headerDiv = document.getElementsByClassName('content-main-header')[0];
    const div = headerDiv.getElementsByClassName("d-flex-tb")[0];
    const header = div.getElementsByTagName("h1")[0];
    const [_, ...accountNameParts] = header.textContent!.split(' - ');
    const accountName = accountNameParts.join(' - ');
    const account = allAccounts.find(acct => acct.attributes.name === accountName);
    console.log('account', account);
    return {
        id: account!.id!,
        name: account!.attributes.name,
    };
}

window.addEventListener("load",function(event) {
    const button = document.createElement("button");
    button.textContent = "Firefly III: Set opening balance";
    button.addEventListener("click", async () => {
        console.log('clicked');
        const accounts = await chrome.runtime.sendMessage({
            action: "list_accounts",
        });
        console.log('accounts', accounts);
        const id = await getCurrentPageAccount(accounts);
        console.log('id', id);
        const ob = await scrapeOpeningBalance(id);
        console.log('tx', ob);
        chrome.runtime.sendMessage(
            {
                action: "store_opening",
                value: ob,
            },
            () => {},
        );
    }, false);
    button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")

    const disclaimer = document.createElement("div")
    disclaimer.innerHTML = "" +
        "<div>This will set the opening balance of the account using the last transaction on this page.</div>" +
        "<div>After setting the opening balance, you should not import any earlier transactions.</div>";
    // TODO: Make this work by automatically setting the opening balance during the page scrape (transactions.tsx)

    document.getElementsByClassName('content-main')[0]?.append(button, disclaimer);
});
