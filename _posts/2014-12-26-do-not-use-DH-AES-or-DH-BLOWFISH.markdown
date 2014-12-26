---
layout: post
title: "Do not use or provide DH-AES or DH-BLOWFISH for SASL/IAL authentication"
---

Atheme 7.2 dropped support for the `DH-AES` and `DH-BLOWFISH` mechanisms.  This was for very good reason.

At the time that `DH-BLOWFISH` was created, IRC was a very different place... SSL was not ubiquitous, and
it was thought that having some *lightweight* encryption on the authentication exchange might be useful, without
opening services to a DoS vector.  An initial audit on `DH-BLOWFISH` found some problems, so a second mechanism,
`DH-AES` was created to get rid of some of them.

However, both of these mechanisms use a [small keysize for Diffie-Helman key exchange (256 bits), as previously
mentioned by grawity](https://nullroute.eu.org/~grawity/irc-sasl-dh.html).  After the freenode incident, where a
user discovered they could DoS atheme by spamming it with `DH-BLOWFISH` requests, we decided to audit both
mechanisms, and determined that they should be removed from the distribution.

The reasons why were:

1. Users had a strong misconception that the mechanisms provided better security than PLAIN over TLS (they don't);
2. Because the DH key exchange is unauthenticated, users may be MITM'd by the IRC daemon;
3. The session key is the same length as the keyexchange phase, making the entire system symmetric.  DH can only
   *securely* provide half the bitspace for the session key as the size of key exchange parameters.  Put more plainly:
   if you use DH in a symmetric manner, *the entire key-exchange is insecure*.
4. Correcting the key exchange to be asymmetric would require rewriting every single implementation anyway.

If you want secure authentication, just use PLAIN over TLS, or use atheme's experimental family of ECDSA
mechanisms, namely `ECDSA-NIST256P-CHALLENGE`.  Yes, it's based on sec256p1, which is a NIST curve, but it's
acceptable for authentication in most cases, and most cryptography libraries implement the sec256p1 curve.  While
not perfect, it is still much better than the DH family of mechanisms.

Unfortunately, [at least one atheme fork has resurrected this mechanism](https://github.com/Elemental-IRCd/emehta/commit/97270f5c28a76378f5a5ae40423da56f85b1a16f).
Hopefully they remove it, as it should be treated as if it were backdoored, because the level of mistakes made
in designing the mechanism would be the same type of mistakes one would introduce if they wanted to backdoor a
mechanism.

**Update**: Unfortunately [Anope also implemented these broken mechanisms](http://bugs.anope.org/view.php?id=1631).
Luckily it appears that X3 has not.
