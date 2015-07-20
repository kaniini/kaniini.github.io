---
layout: post
title: "pkgconf 0.9.12 and future pkgconf versioning changes"
---

pkgconf 0.9.12 was released earlier today which improves some minor edge case issues with the deduplication
support.

You can download the official tarball at http://rabbit.dereferenced.org/~nenolod/distfiles/pkgconf-0.9.12.tar.bz2
as with the rest of the releases.

This is the last planned release on the 0.9 branch.  We are going to move to a versioning scheme where each release
has it's own number.  So, the next release will be pkgconf-1.  I am planning on shipping that in September with the
`libpkgconf` split done, and hopefully improve some things to make life easier for MSYS users again.

A pleasant side effect of this change is that hopefully, we should be able to drop some of the cruft which we provide
for pkg-config compatibility, such as lying about the version number in --version.  After all, 1 is greater than 0.28.

Which brings me to my next point: bug for bug compatibility with pkg-config.  At this point, we're going to be more
conservative in terms of which pkg-config bugs we simulate, as one of the main goals of the pkgconf project was to
be more pedantic.  So generally, starting with today's release, regressions are only accepted as bugs if the modules
involved are actually correctly formed, or similar levels of justification are provided.  This is because we do not
have an interest in providing bug-for-bug compatibility, as we're trying to obviously release a *better* tool.

So for pkgconf-1, mainly we're just doing the split so people can use pkgconf inside their own apps (IDEs, for example),
and fixing whatever bugs are reported and then shipping it in September.  After that, we will work on pkgconf-2 and so on.

That's basically it for now... I might work on developing a talk to explain in greater detail what differences exist
between pkgconf and pkg-config as well as motivations.  More on that later.
