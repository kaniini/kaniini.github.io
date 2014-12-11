---
layout: post
title: "JavaScript authors: You can't trust the DOM when your code is running in contexts you don't control"
---

A common type of request I receive is to audit some JavaScript code to ensure that it is not malicious nor exposing privacy leaks.
This is important for the people who request these types of services, as a lot of them are testing out either advertisements or
social media widget type things, and they don't want information leaked about their users to third parties.

Of course those suppliers want that information anyway, so they try to collect it and use it for their own purposes.  This creates
an interesting situation: can these suppliers be given false information?  The answer is that they can, because they trust a DOM
which is under our control instead of creating their own and using that for their functions.


