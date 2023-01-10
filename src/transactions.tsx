import React from "react";
import {TransactionStore, TransactionTypeProperty} from "firefly-iii-typescript-sdk-fetch";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {AutoRunState} from "./background/auto_state";
import {PageAccount} from "./common/accounts";
import {addButtonOnURLMatch} from "./common/buttons";

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
    accountId: string,
): Promise<TransactionStore[]> {
    const table = document.querySelectorAll('div[aria-label="Transactions"] > div.table-body');
    const txs: Element = table.values().next()?.value;
    if (!txs) {
        return new Promise((r) => r([]));
    }
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
        const sourceId = tType === TransactionTypeProperty.Withdrawal ? accountId : undefined;
        const destId = tType === TransactionTypeProperty.Deposit ? accountId : undefined;

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

async function getCurrentPageAccount(
    allAccounts: AccountRead[],
): Promise<PageAccount> {
    const headerDiv = document.getElementsByClassName('content-main-header')[0];
    const div = headerDiv.getElementsByClassName("d-flex-tb")[0];
    const header = div.getElementsByTagName("h1")[0];
    const [_, ...accountNameParts] = header.textContent!.split(' - ');
    const accountName = accountNameParts.join(' - ');
    const account = allAccounts.find(acct => acct.attributes.name === accountName);
    return {
        id: account!.id!,
        name: account!.attributes.name,
        accountNumber: account!.attributes.accountNumber || undefined,
    };
}


addButtonOnURLMatch(
    'Transactions/History',
    () => false,
    () => {
        const button = document.createElement("button");
        button.textContent = "Firefly III"

        const doScrape = async () => {
            console.log('clicked');
            const accounts = await chrome.runtime.sendMessage({
                action: "list_accounts",
            });
            console.log('accounts', accounts);
            const id = await getCurrentPageAccount(accounts);
            console.log('id', id);
            const txs = await scrapeTransactions(id.id);
            console.log('tx', txs);
            chrome.runtime.sendMessage({
                action: "store_transactions",
                value: txs,
            }, () => {})
            return id;
        }

        chrome.runtime.sendMessage({
            action: "get_auto_run_state",
        }).then(state => {
            if (state === AutoRunState.Transactions) {
                doScrape()
                    .then((id: PageAccount) => {
                        console.log('finished scraping', id);
                        return id;
                    })
                    .then((id: PageAccount) => chrome.runtime.sendMessage({
                        action: "increment_auto_run_tx_account",
                        lastAccountNameCompleted: id.name,
                    }, () => {}))
                    .then(() => window.close());
            }
        });

        button.addEventListener("click", async () => {
            doScrape();
        }, false);
        button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")
        document.getElementsByClassName('content-main-header main-header-related')[0]?.append(button);
    });
