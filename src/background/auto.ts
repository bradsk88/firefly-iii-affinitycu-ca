import {AutoRunState} from "../common/auto";

export function progressAutoRun(state = AutoRunState.Accounts) {
    setAutoRunState(state)
        .then(() => console.log('State stored. Opening tab'))
    .then(() => chrome.tabs.create({
        url: 'https://personal.affinitycu.ca/Accounts/Summary'
    }));
}

async function setAutoRunState(s: AutoRunState): Promise<void> {
    return setAutoRunLastTx("")
        .then(() => chrome.storage.local.set({
            "ffiii_auto_run_state": s,
        }))
        .then(() => console.log('stored state', s))
        .then(() => chrome.runtime.sendMessage({
            action: "update_auto_run_progress",
        }, () => {
        }));
}

export function getAutoRunState(): Promise<AutoRunState> {
    return chrome.storage.local.get(["ffiii_auto_run_state"]).then(r => {
        return r.ffiii_auto_run_state || AutoRunState.Unstarted;
    });
}

export function progressAutoTx(lastAccountName: string) {
    setAutoRunLastTx(lastAccountName)
    .then(() => chrome.tabs.create({
        url: 'https://personal.affinitycu.ca/Accounts/Summary'
    }));
}

async function setAutoRunLastTx(accountName: string): Promise<void> {
    if (!accountName) {
        return chrome.storage.local.remove("ffiii_auto_run_last_transaction_account_name");
    }
    return chrome.storage.local.set({
        "ffiii_auto_run_last_transaction_account_name": accountName,
    })
    // TODO: Indicate transaction progress in addition to autorun stages?
    // chrome.runtime.sendMessage({
    //     action: "update_auto_run_progress",
    // })
}

export function getAutoRunLastTransaction(): Promise<string | undefined> {
    return chrome.storage.local.get(["ffiii_auto_run_last_transaction_account_name"]).then(r => {
        return r.ffiii_auto_run_last_transaction_account_name;
    });
}