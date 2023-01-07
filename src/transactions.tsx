import React from "react";
import {TransactionStore, TransactionTypeProperty} from "firefly-iii-typescript-sdk-fetch";

const monthIndexes: {[key: string]: number} = {
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

function scrapeTransactions(): TransactionStore[] {
    const table = document.querySelectorAll('div[aria-label="Transactions"] > div.table-body');
    const txs: Element = table.values().next().value;
    const txRows = txs.querySelectorAll('div.table-row');
    const data = Array.from(txRows.values()).map((row, index) => {
        const date = row.children.item(0)!.textContent!.trim();
        const desc = row.children.item(1)!.textContent!.trim();
        const amount = row.children.item(2)!.textContent!.trim();

        const tType = amount.startsWith("-") ? TransactionTypeProperty.Withdrawal : TransactionTypeProperty.Deposit;

        const absAmt = amount.replace('$', '').replace('-', '').replace(',', '');

        const dateParts = date.split(', ');
        const year = Number.parseInt(dateParts[1]);
        let dayParts = dateParts[0].split(' ');
        const monthPrf: string = dayParts[0].substring(0, 3);
        const month = monthIndexes[monthPrf];
        const day = Number.parseInt(dayParts[1]);

        // FIXME: Get source ID from account name
        const maximizer = "18";
        const sourceId = tType === TransactionTypeProperty.Withdrawal ? maximizer : undefined;
        const destId = tType === TransactionTypeProperty.Deposit ? maximizer : undefined;

        const tx: TransactionStore = {
            errorIfDuplicateHash: true,
            transactions: [{
                type: tType,
                sourceId: sourceId,
                destinationId: destId,
                date: new Date(year, month, day),
                amount: absAmt,
                description: desc,
                currencyCode: 'CAD',
            }],
        }
        return tx;
    });
    return data;
}

window.onload = () => {
    const button = document.createElement("button");
    button.textContent = "Firefly III"
    button.addEventListener("click", () => {
        const txs = scrapeTransactions();
        chrome.runtime.sendMessage(
            {
                action: "store_transactions",
                value: txs,
            },
            () => {},
        );
    }, false);
    button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")
    document.getElementsByClassName('content-main-header main-header-related')[0]?.append(button);
};
