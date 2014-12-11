---
layout: post
title: "Upgrading a production machine to Alpine 3.x - the definitive guide"
---

This documents my upgrade process to the Alpine 3.0 tree from Alpine 2.8 tree.  In reality, they are the same tree,
but with different build parameters... specifically Alpine 3.0 uses Musl and Alpine 2.8 does not.  Alpine 2.8 is also
the last planned release series featuring uClibc.

The first step is to make sure you are using a modern apk-tools.  Upgrade your system to 2.8 development (`edge`) if
you've not done so already.  Then install the static-linked version of apk-tools:

{% highlight bash %}
$ apk add apk-tools-static
{% endhighlight %}

Now modify your `/etc/apk/repositories` file to use the `edge-musl` repository.  I recommend using this URL, but I
may be biased:

    http://mirrors.centarra.com/alpine/edge-musl/main
    @testing http://mirrors.centarra.com/alpine/edge-musl/testing

Now do the actual upgrade.  We're going to use some flags that are not typically used, but are necessary to pivot the
system safely into the new libc environment.

{% highlight bash %}
$ apk.static update
$ apk.static upgrade --available --no-self-upgrade
{% endhighlight %}

You are now running Musl, but you probably noticed that your configs for `mkinitfs` are wrong.  Lets fix that and then
reinstall the kernel package.

Change your `/etc/mkinitfs/files.d/base` to contain these lines:

    /bin/busybox
    /bin/sh
    /lib/libcrypto.*
    /lib/libz.*
    /lib/ld*-musl*.so*
    /lib/mdev
    /sbin/apk
    /etc/modprobe.d/*.conf
    /etc/mdev.conf

Now we just reinstall the kernel package:

{% highlight bash %}
$ apk fix linux-grsec
{% endhighlight %}

Voila.  We can now reboot and be purely on Musl.

