PAGE_CHROME_MARKERS = {
    "Animated P11 Logo",
    "BUZZ",
    "Contact Us",
    "< PREVIOUS",
    "ALL POSTS",
    "NEXT >",
    "Back to Top",
    "Related Articles",
    "Stay updated with the latest trends, strategies, and best practices in real estate marketing.",
    "Level Up Your Marketing IQ",
    "Partner with P11 to turn",
    "Get Started",
    "Let’s Build Something Big",
    "GET ON STAGE",
    "Join Our VIP List!",
    "Ready to elevate your brand presence?",
    "Book a call today!",
    "Reach Us Online",
    "company",
    "Team",
    "Core Values",
    "Client List",
    "P11 Props",
    "Careers",
    "solutions",
    "Brand Studio",
    "Digital Engagement",
    "Demand Generation",
    "Intelligence and Optimization",
    "All Solutions",
    "Markets",
    "Multifamily",
    "Master-Planned Communities",
    "55+ Living",
    "New Homes",
    "All Markets",
    "STUDIO HQ",
    "LET'S GET SOCIAL",
}


def clean_article_body(body: str, title: str | None = None) -> str:
    lines = [line.strip() for line in body.replace("\u200d", "").splitlines()]
    cleaned: list[str] = []
    in_article = False if title else True

    for line in lines:
        if not line:
            continue

        if title and line == title:
            in_article = True
            cleaned.append(line)
            continue

        if not in_article:
            continue

        if _is_footer_start(line):
            break

        if _is_chrome_line(line):
            continue

        cleaned.append(line)

    return "\n\n".join(cleaned).strip() or body.strip()


def _is_chrome_line(line: str) -> bool:
    if line in PAGE_CHROME_MARKERS:
        return True
    if line.endswith("*") and "@" in line:
        return True
    if line.startswith("© Copyright"):
        return True
    if line in {"714 641 2090", "info@p11.com"}:
        return True
    if line.startswith("20331 Irvine Avenue"):
        return True
    if line.startswith("Newport Beach, CA"):
        return True
    return False


def _is_footer_start(line: str) -> bool:
    return line in {
        "Back to Top",
        "Related Articles",
        "Partner with P11 to turn",
        "GET ON STAGE",
        "Ready to elevate your brand presence?",
    }
