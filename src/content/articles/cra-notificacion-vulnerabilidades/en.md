---
title: "Reporting vulnerabilities under the CRA: what it requires, and how fast"
slug: "cra-vulnerability-reporting"
summary: "Since September 2026 you have 24 hours to flag an actively exploited vulnerability. What the CRA requires, who counts as a manufacturer, and what to prepare."
date: 2026-09-23
sources:
  - title: "European Commission — CRA reporting obligations"
    url: "https://digital-strategy.ec.europa.eu/en/policies/cra-reporting"
  - title: "ENISA — Single Reporting Platform: frequently asked questions"
    url: "https://www.enisa.europa.eu/topics/product-security/single-reporting-platform-srp/frequently-asked-questions"
  - title: "ENISA switches on the single reporting platform (Help Net Security)"
    url: "https://www.helpnetsecurity.com/2026/09/14/enisa-cra-single-reporting-platform/"
  - title: "CRA reporting is now mandatory (Crowell & Moring)"
    url: "https://www.crowell.com/en/insights/client-alerts/its-live-the-cyber-resilience-act-reporting-is-mandatory-as-of-today-11-september-2026"
---

On 11 September 2026 the part of Regulation (EU) 2024/2847 — the Cyber
Resilience Act — that changes daily life for anyone shipping software in Europe
came into force. It is not the part everyone discussed at the time, the CE
marking and the essential requirements, which is still some way off. It is the
reporting part, and the clock is already running.

## What changed

From that date, a manufacturer who learns that a vulnerability in their product
is being actively exploited has to report it. Not to their customers — that too,
but that is a different conversation — but to the authorities: the CSIRT
designated as coordinator, and ENISA. The same applies to a severe incident
affecting the security of the product.

The report does not go out by email, and there is no hunting for the right
national form. ENISA switched on the single reporting platform foreseen in
Article 16 that same day, and one submission reaches the coordinating CSIRT and
the agency at once. That is probably the best news in the package: the
administrative part is solved.

## Why this likely includes you

The word "manufacturer" suggests a company with a factory floor. In the
regulation it means something else: whoever places a product with digital
elements on the Union market. A mobile app in a store, a downloadable
executable, a widget, a device with firmware. Company size does not change the
category.

Two details are worth pinning down before assuming this does or does not reach
you. First: the obligations also cover products already on the market, not only
what ships from now on. Second: entities that steward open-source software in a
structured way have their own version of the obligation, on a different
timetable starting in December 2027. Anything outside both figures — a personal
project published with no commercial activity behind it — is a different story,
and that is exactly the point where you read the text rather than trust a
summary, this one included.

## The three deadlines

The regulation splits reporting into three moments, each asking for a different
level of detail:

An **early warning within 24 hours** of the manufacturer becoming aware of
active exploitation. It is deliberately short: identify the manufacturer and the
product, say what happened and when, and note the initial impact and any
mitigation that already exists. You do not need the answer; you need to raise
your hand.

A **notification within 72 hours** carrying the initial assessment: what is
known about the vulnerability or incident, its scope, and where the fix is
heading.

A **final report within 14 days** of a corrective or mitigating measure becoming
available. This is where the full account is expected.

Seen all at once it looks like a lot. Seen from inside an organisation that
already handles incidents, the hard part is not the deadlines: it is the first
one. Twenty-four hours burn down on their own while someone works out whether
the email that arrived is real, who owns that product, and whether "actively
exploited" means what it appears to mean.

## What has to exist beforehand

The usual misreading is to treat this as paperwork and leave it for the day it
happens. Deadlines are not met with a written procedure; they are met with three
things that exist before the incident.

**Knowing what you ship.** When a vulnerability lands in a dependency, the
operational question is not whether it is severe, but whether it is in any of
your products and in which versions. Without a dependency inventory per release
— an SBOM generated from the lockfile, not from what your build files declare —
that question gets answered by hand, repository by repository, with the clock
running. It is why we generate one on every release and attach it to the
release itself: an inventory that expires with a 90-day CI artifact is no use
when someone asks about a version from last year.

**Having a way to find out.** A published contact channel, with a policy that
says where to write and what to expect, and that somebody actually reads. If the
security mailbox is checked on Mondays, the 24-hour window is compromised before
it starts.

**Knowing who decides.** Someone signs the notification. Better to settle who
that is before you need them, and to make sure that person knows where the ENISA
platform is and which credentials get them in.

## What it does not solve

Worth saying, because compliance talk tends to sell reassurance: reporting
protects nobody. It is a mechanism for information to circulate and for
authorities to see the shape of the problem. Protection comes from what happens
earlier — watched dependencies, verifiable artifacts, the ability to ship a fix
quickly — and from what happens later, which is the patch actually reaching the
people running the software.

There is also an honest tension in the design: telling the authorities about an
exploited vulnerability before a fix exists concentrates sensitive information in
one place. The regulation handles it with restrictions on use and dissemination,
but it is a legitimate debate, not paranoia to be waved away.

## What we would do starting today

In order, and with none of the three being a project in its own right: generate
the dependency inventory in the pipeline and attach it to every release; publish
a security contact channel with a written, realistic policy; and put in writing
who reports, with which account, and within what internal deadline — an internal
deadline shorter than the legal one, because the legal one is the limit, not the
target.

With that in place, the day the report arrives, 24 hours is plenty. Without it,
24 hours is just enough to discover that nobody knew which versions were
affected.
