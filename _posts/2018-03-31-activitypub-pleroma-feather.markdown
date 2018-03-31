---
layout: post
title: "ActivityPub, Pleroma and Feather"
---

## First, some background.

In 2006, Evan Prodromou started a project that was intended to be a free software alternative to
commercialized social media platforms that he originally called Laconica.  After a while, this was
renamed to StatusNet, and then later was placed under the purview of the GNU project.  The GNU
social software is built on a protocol stack known as OStatus, which is essentially a clever
combination of other specifications.

Meanwhile, Evan started a new project called pump.io, which spoke a new protocol that was built
on top of JSON.  This protocol eventually fell under the stewardship of the W3C Social Web group,
which initially called it ActivityPump, and then later ActivityPub.  Development of the ActivityPub
protocol went on for a few years until it was eventually ratified as an official W3C recommendation
in early 2018.

While all of this was going on, as many people know, Eugen Rochko created the Mastodon project,
in part as a reaction to problems on Twitter that first got major public attention during the 2016
US presidential election.  Between November 2016 and April 2017, Mastodon got nearly 200k users,
across a handful of instances.  Mastodon built on top of the pre-existing OStatus infrastructure,
so it could tap into the pre-existing userbase using GNU Social and Hubzilla.

In April 2017, Mastodon was brought to my attention, and I deployed it using a service called
Scalingo.  Mastodon is a Ruby on Rails application, and so I felt it was worth $20/month to make
maintaining it effectively not my problem.


## Mastodon Hardened

All went well, and eventually I switched from using Twitter to using Mastodon as my primary
social media tool.  But then I started noticing that Mastodon did not really do a very good job
at guaranteeing user safety, and had design features that were entirely irresponsible, such as
sending Block activities to the server of the person that was being blocked, in a bizzare
attempt to emulate the Twitter block system.  (As an aside, I'm not sure why anyone would want
to emulate the Twitter block system, of course, given that it is trivially evaded by opening
an incognito browser window.)

As a result, I wound up starting a friendly fork of Mastodon which followed the upstream tree but
removed or replaced functionality that was user-hostile (such as the Twitter block emulation) or
actually dangerous.  I also fixed the timeline building code so that it would implicitly mute
anyone who had blocked you, so that you wouldn't have to deal with any potential harassment from
somebody who had blocked you (a long-standing bug in Mastodon that still isn't completely fixed
today).

This went on for a while, and everything was fine, but then Mastodon 2.2 introduced a ton of changes,
so I wound up staying on Mastodon 2.1 for my instance, which meant that I never bothered to update
Mastodon Hardened to 2.2.  Which meant the fork died.

Around this time, Scalingo changed their pricing a bit, and the instance started to creep up in
costs.  Additionally, they started billing for CPU time used while compiling new instances of the
app, which meant that any time I changed anything, I would be charged for that.


## Moving from Mastodon to Pleroma

This lead me to start thinking about different hosting for my instance, but Mastodon was starting
to get really heavy.  Which got me to thinking about writing a new implementation from scratch,
which I did start working on for a while called Eshu.

Around the time that I started to get frustrated with developing an entire social streams server
from scratch in asyncio, with an ecosystem that wasn't really up to the challenge of supporting it,
Pleroma announced that they had gotten their ActivityPub implementation to the point that it could
be used in production.  Additionally, Pleroma was frontend-agnostic (more on this later) and had
bundled the Mastodon frontend as one of their frontend choices.  lain, the primary Pleroma developer
also ran her own instance on a raspberry pi, which was very interesting.  So, I wound up buying a
$3/month ARM server from Scaleway to see if it really would work out.

I already had some familiarity with Elixir, so I decided to give Pleroma a try.  Within a few hours,
I was pretty much convinced that Pleroma was the way to go for my needs, and flipped the switch.
The mastodon.dereferenced.org instance was decomissioned, in favor of the Pleroma one.


## Getting involved in Pleroma development

While I did switch from Mastodon to Pleroma, when I initially switched, the ActivityPub implementation
was not fully compatible with Mastodon's extensions.  So, I went to work and started sending patches
to fix them.  After a while, people started asing me if I could implement changes for their needs in
the Pleroma backend, so I started working on those issues too.

After a while, with some patching, we managed to get a fully compatible ActivityPub implementation that
could federate with Mastodon and others like PeerTube without any problems.  This is the reality today,
and the 1.0 release will likely come within a month or two, with a full implementation report sent in
to the W3C.


## Feather

One evening, it hit me: if Pleroma is a generic social streams server that supports every client
API used in the fediverse right now, then it would be a good starting point for building a new frontend,
as it is effectively a platform for building social networking applications.

Specifically, I felt that the "lets be like Twitter" microblogging space was oversaturated.  There was
Pleroma with the Pleroma FE and Mastodon FE, there was Mastodon itself, and there were the OStatus nodes
that both Pleroma and Mastodon could interoperate with.

So one of the main design goals for Eshu was to do away with that concept entirely.  As such, I started
taking my mental models of how the interface would work and began building them as a Progressive Web App
(PWA) that runs on the Pleroma platform, using vue.js.  It should be noted that I am not really much of
a web developer and have been making this up as I go along.  Hopefully other people will send in patches
to fix my mistakes.

This frontend is called Feather, and it is more similar to something like Facebook than Twitter.

### Screenshots of Feather

As an idea of how it looks, here is a screenshot of the basic Home timeline:

<img src="https://pleroma.dereferenced.org/media/c96f4655-57df-440e-bbfb-02a1bdd08c68/image.png" style="height: 300px;" alt="Feather's home screen">

Feather uses hierarchical threading, which allows for discovering new people to interact with:

<img src="https://pleroma.dereferenced.org/media/558d7ee0-01c9-4483-9ca4-10caca15774c/image.png" style="height: 450px;" alt="A thread in feather, hierarchically represented">

There is also a work in progress "media view" for tags, which works nicely with tags like "#art" or "#photography":

<img src="https://pleroma.dereferenced.org/media/c1572054-92f8-47ff-bd5a-560fccdfe70d/image.png" style="height: 350px;" alt="Feather's media view">

There's still a lot to do, but Feather demonstrates that it is possible to build any kind of social networking application on the Pleroma platform.

I plan to put up a public instance running Pleroma + Feather soon, so that people can try it for themselves, too.
