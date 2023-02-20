import {TransactionStore, TransactionTypeProperty} from "firefly-iii-typescript-sdk-fetch";
import {AutoRunState} from "../background/auto_state";
import {
    getButtonDestination,
    getCurrentPageAccount,
    getRowAmount,
    getRowDate, getRowDesc,
    getRowElements, isPageReadyForScraping
} from "./scrape/transactions";
import {PageAccount} from "../common/accounts";
import {runOnURLMatch} from "../common/buttons";
import {runOnContentChange} from "../common/autorun";
import {AccountRead} from "firefly-iii-typescript-sdk-fetch/dist/models/AccountRead";
import {isSingleAccountBank} from "../extensionid";
import {backToAccountsPage} from "./auto_run/transactions";
import {debugLog} from "./auto_run/debug";

interface TransactionScrape {
    pageAccount: PageAccount;
    pageTransactions: TransactionStore[];
}

let pageAlreadyScraped = false;

async function doScrape(isAutoRun: boolean): Promise<TransactionScrape> {
    if (isAutoRun && pageAlreadyScraped) {
        throw new Error("Already scraped. Stopping.");
    }

    const accounts = await chrome.runtime.sendMessage({
        action: "list_accounts",
    });
    const acct = await getCurrentPageAccount(accounts);
    const txs = scrapeTransactionsFromPage(acct);
    pageAlreadyScraped = true;
    await chrome.runtime.sendMessage({
            action: "store_transactions",
            is_auto_run: isAutoRun,
            value: txs,
        },
        () => {
        });
    if (isSingleAccountBank) {
        await chrome.runtime.sendMessage({
            action: "complete_auto_run_state",
            state: AutoRunState.Transactions,
        });
    }
    return {
        pageAccount: {
            accountNumber: acct.attributes.accountNumber!,
            name: acct.attributes.name,
            id: acct.id,
        },
        pageTransactions: txs,
    };
}

const buttonId = 'firefly-iii-export-transactions-button';

function addButton() {
    const button = document.createElement("button");
    button.id = buttonId;
    button.textContent = "Firefly III"
    button.addEventListener("click", async () => doScrape(false), false);
    button.classList.add("btn-md", "btn-tertiary", "w-135-px", "d-flex-important", "my-auto", "print-hide")
    getButtonDestination().append(button);
}

function enableAutoRun() {
    if (!isPageReadyForScraping()) {
        debugLog("Page is not ready for scraping")
        return;
    }
    chrome.runtime.sendMessage({
        action: "get_auto_run_state",
    }).then(state => {
        debugLog("Got state", state)
        if (state === AutoRunState.Transactions) {
            doScrape(true)
                .then((id: TransactionScrape) => {
                    if (isSingleAccountBank) {
                        return chrome.runtime.sendMessage({
                            action: "complete_auto_run_state",
                            state: AutoRunState.Transactions,
                        })
                    } else {
                        return chrome.runtime.sendMessage({
                            action: "increment_auto_run_tx_account",
                            lastAccountNameCompleted: id.pageAccount.name,
                        }).then(() => backToAccountsPage())
                    }
                });
        }
    });
}

const txPage = 'Transactions/History';

runOnURLMatch(txPage, () => pageAlreadyScraped = false);

// If your manifest.json allows your content script to run on multiple pages,
// you can call this function more than once, or set the urlPath to "".
runOnContentChange(
    txPage,
    () => {
        if (!!document.getElementById(buttonId)) {
            return;
        }
        addButton();
    },
    getButtonDestination,
)


runOnContentChange(
    txPage,
    enableAutoRun,
    () => document.querySelector('app-root')!,
    'txAutoRun',
);
