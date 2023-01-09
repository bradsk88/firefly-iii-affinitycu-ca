import React from "react";
import {TransactionStore, TransactionTypeProperty} from "firefly-iii-typescript-sdk-fetch";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {AutoRunState} from "./common/auto";

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

async function scrapeTransactions(
    accountNo: string,
): Promise<TransactionStore[]> {
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
        const sourceId = tType === TransactionTypeProperty.Withdrawal ? accountNo : undefined;
        const destId = tType === TransactionTypeProperty.Deposit ? accountNo : undefined;

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
    return data.map(ts => {
        ts.transactions = ts.transactions.filter(t => t.amount.trim() !== "")
        return ts;
    });
}

async function getCurrentPageAccountId(
    allAccounts: AccountRead[],
): Promise<string> {
    const headerDiv = document.getElementsByClassName('content-main-header')[0];
    const div = headerDiv.getElementsByClassName("d-flex-tb")[0];
    const header = div.getElementsByTagName("h1")[0];
    const [_, ...accountNameParts] = header.textContent!.split(' - ');
    const accountName = accountNameParts.join(' - ');
    const account = allAccounts.find(acct => acct.attributes.name === accountName);
    console.log('account', account);
    return account!.id!;
}

window.addEventListener("load",function(event) {
    const button = document.createElement("button");
    button.textContent = "Firefly III"

    const doScrape = async () => {
        console.log('clicked');
        const accounts = await chrome.runtime.sendMessage({
            action: "list_accounts",
        });
        console.log('accounts', accounts);
        const id = await getCurrentPageAccountId(accounts);
        console.log('id', id);
        const txs = await scrapeTransactions(id);
        console.log('tx', txs);
        chrome.runtime.sendMessage(
            {
                action: "store_transactions",
                value: txs,
            },
            () => {
            },
        );
    }

    chrome.runtime.sendMessage({
        action: "get_auto_run_state",
    }).then(state => {
        if (state === AutoRunState.Transactions) {
            // TODO: Simulate a click on an account
            doScrape().then(() => {
                // TODO: This isn't really right.  The row checking code will go in accounts.
                if (onLastRow) {
                    chrome.runtime.sendMessage({
                        action: "complete_auto_run_state",
                        state: AutoRunState.Transactions,
                    })
                } else {
                    chrome.runtime.sendMessage({
                        action: "increment_auto_run_tx_account",
                        lastIndexCompleted: 0,
                    })
                }
                window.close();
            });
        }
    });

    button.addEventListener("click", async () => {
       doScrape();
    }, false);
    button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")
    document.getElementsByClassName('content-main-header main-header-related')[0]?.append(button);
});
