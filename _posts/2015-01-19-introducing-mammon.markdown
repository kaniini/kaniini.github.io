---
layout: post
title: "Rethinking ircd"
---

Lately I have been working on an ircd, initially to host the channels which will be moved from `irc.atheme.org` once it is terminated.
The result of this work is three python packages: [ircmatch][gh-ircmatch], [ircreactor][gh-ircreactor], and [mammon][gh-mammon].  When combined,
these provide a modular IRC implementation - `ircmatch` provides IRC hostmask matching and collapsing, `ircreactor` provides translation and manipulation of
RFC1459 messages into an intermediate representation, and `mammon` brings it all together on top of Python 3.4's excellent `asyncio` framework.

  [gh-ircmatch]: http://github.com/kaniini/ircmatch
  [gh-ircreactor]: http://github.com/kaniini/ircreactor
  [gh-mammon]: http://github.com/kaniini/mammon

This post is long, and somewhat serves as a manifesto for the project, what we have in mind for both now and the future, and how all of this maps onto
the [IRCv3 standardization effort][ircv3].  While I can only recommend reading the entire post, I can provide a good overview in a few buzzwords:
server-side authentication without services, channel management which makes sense and protocol correctness verification.  The code is available if you want
to play with it, and a server is running at `mouse.dereferenced.org:6667`, to prove that this is a real thing.

  [ircv3]: http://ircv3.org/

### the ircds of yesterday

Every IRC network operates software called `ircd`.  Most IRC networks also operate an authentication layer, which is provided by software called "services".
Atheme and Anope are presently the primary middleware platforms deployed by networks which provide the authentication layer.

Historically, the software acting as `ircd` has been derived from IRC 2.8, which has been showing it's age for a long time.  Many other replacements have
been proposed over time, but only one of them really took off: [InspIRCd][inspircd], which is now the second-most widely used `ircd` implementation.
InspIRCd could actually be used for prototyping new features, however, it's written in C++ which makes it intimidating to new developers.

In fact, InspIRCd has implemented prototypes of many of the features we plan to implement in mammon.  However, it is tied to having to support legacy
clients and legacy approaches to network and channel management.  This in combination with the C++ codebase makes it a difficult target for prototyping
large changes to the protocol and user experience.

### throwing out legacy design

As a result of this, I started writing a new server that threw out basically everything.  RFC1459 is only considered a suggestion, with preference given
to the IRCv3 interpretation on issues.  This server is designed to allow us to eventually completely jettison the RFC1459 framing format, even.

Actually, I wrote an earlier server which ultimately was not viable.  mammon is the rewrite, of the rewrite.

But what does it really *mean* to throw out legacy design?  What it means in context of mammon is:

 * mammon does not directly operate on messages: instead, it operates on intermediate representations of the effects caused by messages.
   The intermediate representation can be serialized to one or more IRC messages.

 * mammon does not directly link to other servers: instead, server linking is just another protocol which consumes and distributes state
   transformations.  (an actual implementation of this isn't yet written, but the plumbing is there to support it cleanly)

 * legacy concepts such as channel modes are not presently implemented: instead, we plan to map them onto more appropriate primitives, such
   as IRCv3.3 properties and access lists.

### maintaining scalability

Right now, the design of mammon is not *intended* to be scalable.  We will speed it up as the software matures.  However, a common concern that has
been mentioned is that mammon may fail to scale because it is written in Python.  To this, I argue that we can maintain good scalability both on CPython,
and provide better than ircd 2.8's scalability on a high performance VM such as pypy once it supports `yield from`.

Put differently: `ircd` is an I/O-bound application.  The main area where we need to be careful is ensuring we can keep our TLS code parallelizable, but
Python already provides excellent primitives for this.  It will be interesting to see how mammon performs verses other IRCds such as charybdis and
InspIRCd as the software matures.

### why not inspircd?

Although the Atheme community and InspIRCd developers have not always agreed on some issues (mostly related to InspIRCd's now-defunct `m_invisible.so`),
I do want to stress that in general, as far as C++ codebases go, InspIRCd is pretty easy to follow.  However, InspIRCd *is* a C++ codebase.  One of my
main goals with mammon, is to make IRCd even more accessible for people looking to learn about programming.  By using a language such as Python, this is
a goal that is easily accomplished.

From a technical debt perspective, both the C++ codebase and the obligation to support legacy network deployments makes InspIRCd an undesirable choice
for prototyping new features.  The point of mammon is that it *is* a playground to try new things, this is as far as I know, not a goal of InspIRCd at
this time.

### putting it all together

Right now we have an ircd which implements a lot of the core fundamentals to make this system work.  The rest of the fundamentals will be implemented as
time permits, but we already have reasonably good [RFC1459 coverage][gh-mammon-1].  We still need to implement many components of IRCv3.2 itself, but this
should not be too difficult.  Pull requests are definitely something we would take a look at...

The way mammon works, as previously mentioned is to operate on intermediate representation.  This allows us to replace the RFC1459 transport with whatever
transport we like.  It also allows semantic information to be attached to the message in a flexible way, either as tags or as internal properties.  This
allows for simpler implementations of features which depend on state in a way which requires little to no boilerplate.

With any luck, mammon will be as influential as it's predecessor was.

  [gh-mammon-1]: https://github.com/kaniini/mammon/issues/2
