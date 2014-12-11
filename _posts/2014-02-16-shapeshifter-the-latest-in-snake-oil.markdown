---
layout: post
title: "ShapeShifter: The Latest in Snake Oil"
---

Several people sent me a link recently to the [ShapeShifter](http://www.shapesecurity.com/product/), a new
web-application firewall product released by [Shape Security](http://www.shapesecurity.com/).  Among other
things, it promises to protect your website by "applying polymorphism as a defense strategy."

This is snake oil.  First, because, none of the HTML markup transformations it actually does can be considered
at all polymorphic, and secondly, because these methods have already been tried in the real-world and discarded
because they are pointless.

Actually, the [product video](https://www.youtube.com/watch?v=bsQ4slqOswc) shows what it is really doing, which
is scrambling HTML attributes and rewriting them to the correct input on the application side.  This is nothing
new, really.

<center>
	<img width="631" height="341" src="/images/shapeshifter-video.png" alt="What ShapeShifter really does">
</center>

Malicious bots can already defeat ShapeShifter, simply by walking the DOM.  I don't hesitate to mention this,
because the bad guys *already do this*.  A login field is always going to be prefixed by a label saying whether
or not it's a username, e-mail address or password field.  And really, you don't have to look at it that way --
a username field will almost certainly come before a password field in the DOM.

Then you have their [bizzare press release](http://www.marketwired.com/press-release/Shape-Comes-Out-of-Stealth-Launches-Product-to-Reinvent-Website-Security-1870707.htm),
which has strange statements like:

> "The ShapeShifter focuses on deflection, not detection. Rather than guessing about traffic and trying to intercept
> specific attacks based on signatures or heuristics, we allow websites to simply disable the automation that 
> makes these attacks possible."

This is how you know it's 100% bullshit.  The scripts that the criminals are using will simply be adapted to walk
the DOM, and most of them already walk the DOM anyway.  There's frameworks that allow you to [drive an entire
browser](http://splinter.cobrateam.info/) programatically.  These frameworks would not be defeated by ShapeShifter's
markup transformations.

Instead, lets work on truly innovative ways of defeating bots like implementing the
[Edia JSON signature scheme](https://pypi.python.org/pypi/ediarpc) into web requests. Make the browser complete a
complex (and most importantly, computationally expensive) proof of work in JavaScript.  ShapeShifter is not the
way forward, even CAPTCHAs are better protection than that.
