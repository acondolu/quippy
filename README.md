# quippy

_Quippy_ is a secure, end-to-end encrypted expense-splitting app. Whether you’re sharing a meal, planning a trip, or managing group expenses, Quippy makes it easy and private. Here’s how to use "Quippy" in a sentence:
- "The bill at the restaurant was 10€. Let's quipp-it."
- "We should quippy the expenses for our summer holiday!"



#### Key Features:
- **Flexible Expense Splitting**: Divide costs among any number of participants.
- **No Registration Required**: Start using Quippy immediately—no sign-up needed.
- **Progressive Web App (PWA)**: Quippy works seamlessly on both desktop and mobile devices.
- **Dark Mode Support**: Enjoy a nerd-friendly dark mode. 😎
- **End-to-End Encryption**: Your data is fully encrypted, meaning not even the Quippy server can access the details—only the participants in an expense list can view them.

You access the Quippy app here:

<div align="center">
  <a href="https://acondolu.me/quippy" target="_blank">
    https://acondolu.me/quippy
  </a>
</div>



### Getting Started

You can start by either creating a new expense list or joining an existing one.

To join an expense list, you’ll need a _join token string_ provided by the list creator. This token acts as a secure key, allowing you to access the specific expense list.

When you create a new list, Quippy automatically generates a new unique token, which you can share with others to invite them. The join token is part of the encryption process and ensures that only those with the token can access the expense details.

Please note that all your data is stored locally in your browser’s storage. This means your expense lists won’t be available if you switch to a different browser, use private browsing, or clear your browser’s local storage. To keep your lists accessible, make sure to use the same browser and avoid clearing your storage while you still need the data.

### Technical Overview

Quippy is built as a Progressive Web App (PWA) with a client-server architecture:
- **Client** is built using VueJS, Bootstrap and TypeScript.
- The **server** is simply an MQTT broker (e.g. Mosquitto) to handle the communication between clients. No database is used; instead, messages exchanged between participants are encoded in MQTT topics and temporarily cached to enhance offline functionality. However, all data is end-to-end encrypted, so the server cannot access the contents of cached messages.

#### Security
- **Zero-Knowledge Architecture**: The Quippy MQTT broker operates with zero knowledge of the data contents. It only facilitates communication between clients without being able to decrypt any user data.
- **Encryption Protocol**: Quippy uses AES with Galois/Counter Mode (AES-GCM) to encrypt all data before it leaves the client. The decryption keys are only available to the participants in the expense list. Keys are generated on the user device and never shared with the server.

### TODO

- [ ] Delete expense
- [ ] Delete participant
- [ ] Change date of expense
- [ ] Change currency

### Building

```bash
$ npm i                    # install npm dependencies
$ npm run build            # for production
$ npm run build -- --watch # for development
```
