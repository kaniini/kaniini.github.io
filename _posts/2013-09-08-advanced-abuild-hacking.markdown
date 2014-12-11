---
layout: post
title: "advanced abuild hacking, part 1"
categories: alpine
---

This is kind of a quick and direct introduction to how to work with abuild and APKBUILDs in
a low-level way.

abuild(1) takes a list of targets, much like make(1) does.  If you do not specify any targets,
it defaults to a default set of targets.  This functionality is provided by `all()` in abuild.

What this means is that we can run specific targets and get specific effects, which is useful
when you are debugging an APKBUILD.

## Installing the build dependencies for an APKBUILD

abuild(1) uses the builddeps() target to determine dependencies and depending on how it is invoked,
synthesize a transaction in the package manager to install a set of packages pinned as dependencies
of `.makedepends-$pkgname`.  This behaviour is derived from similar behaviour in Debian's pbuilder(1).

Thusly, we can invoke the `builddeps` target in order to install our dependencies, like so:

{% highlight bash %}
$ abuild -r builddeps
(1/1) Installing .makedepends-foo (0)
{% endhighlight %}

As all of our dependencies are pinned to `.makedepends-$pkgname`, removing them when we are done is
also fairly easy:

{% highlight bash %}
$ abuild-apk del .makedepends-foo
(1/1) Removing .makedepends-foo (0)
{% endhighlight %}

## Splitting up build logic into substeps

Some packages, such as the Xen hypervisor consist of many different components integrated into a
single APKBUILD.  In the case of Xen, we have the hypervisor itself, management tools, stub domains,
and documentation.  Splitting up these components into individual build targets allows us to debug
the build process of the individual components, without having to build the other components.  This
saves time when the build process is relatively time-consuming.

For a practical example of this, we will look at the relevant parts of the APKBUILD of Xen 4.3:

{% highlight bash %}
# These tasks are added as separate tasks to enable a packager
# to invoke specific tasks like building the hypervisor.  i.e.
#    $ abuild configure build_tools
configure() {
	cd "$_builddir"

	msg "Running configure..."
	./configure --prefix=/usr \
		--build=$CBUILD \
		--host=$CHOST \
		|| return 1
}

build_hypervisor() {
	msg "Building hypervisor..."
	make xen || return 1
}

build_tools() {
	msg "Building tools..."
	make tools || return 1
}

build_docs() {
	msg "Building documentation..."
	make docs || return 1
}

build_stubdom() {
	msg "Building stub domains..."
	make stubdom || return 1
}
{% endhighlight %}

These are the individual build steps for building each component.  abuild(1) itself calls the
`build` target, so we will need to have our APKBUILD fan out to each build step.  We provide our
own `build` function to glue it all together, although I hope to be able to improve abuild(1)
where this will eventually be unnecessary.

This is our `build` function:

{% highlight bash %}
build() {
	cd "$_builddir"

	configure || return 1
	build_hypervisor || return 1
	build_tools || return 1
	build_docs || return 1
	build_stubdom || return 1
}
{% endhighlight %}

The `return 1` at the end of each step is important.  It ensures that abuild(1) gives up if
any of the components fail to properly build.

What this nets us is the ability to do the following:

{% highlight bash %}
# Clean, unpack and prepare our build environment (including patching).
$ abuild clean unpack prepare

# Test building only the hypervisor.
$ abuild configure build_hypervisor
{% endhighlight %}

In the event that we only need to look at building the hypervisor, or the management tools, this
work has now cut our build times significantly.

You can also add utility targets, such as invoking `make menuconfig` in the kernel.  Here is
an example of that, from the linux-vanilla APKBUILD:

{% highlight bash %}
# this is so we can do: 'abuild menuconfig' to reconfigure kernel
menuconfig() {
	cd "$srcdir"/build || return 1
	make menuconfig
	cp .config "$startdir"/$_config
}
{% endhighlight %}

As you can see, the ability to declare custom targets in APKBUILDs allows for versatile
control over the build process.
