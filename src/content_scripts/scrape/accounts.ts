import {sha512} from "js-sha512";

export function getAccountElements(): HTMLElement[] {
    const forms = document.querySelectorAll('form[action="/Transactions/History"]');
    return Array.from(forms.values()).map(v => v.getElementsByTagName("button")[0]);
}

export function getAccountNumber(
    accountElement: HTMLElement,
): string {
    const input = accountElement.getElementsByTagName("input")[0];
    let accountNumber = input.attributes.getNamedItem('value')!.value;
    return sha512(accountNumber);
}

export function getAccountName(
    accountElement: HTMLElement,
): string {
    return accountElement.attributes.getNamedItem('aria-label')!.value
        .split('Transaction History for ')[1];
}