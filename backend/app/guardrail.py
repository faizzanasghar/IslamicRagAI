"""
Islamic Topic Guardrail
=======================
Zero-cost topic classifier that uses:
  1. Keyword fast-reject  — O(1) lookup for obvious non-Islamic queries
  2. Cosine similarity    — semantic check vs. 50 pre-computed Islamic anchor embeddings
                            using the already-loaded SentenceTransformer model

The anchor embeddings are pre-computed once during RAGEngine.initialize()
and stored as numpy arrays — no extra RAM or model required.
"""

import numpy as np
from typing import Tuple

# ---------------------------------------------------------------------------
# Islamic anchor phrases — these get embedded once at startup
# ---------------------------------------------------------------------------
ISLAMIC_ANCHOR_PHRASES = [
    # Core pillars & beliefs
    "the five pillars of Islam",
    "Tawheed the oneness of Allah",
    "belief in Allah his angels prophets and books",
    "Day of Judgment resurrection Islam",
    "paradise jannah in the Quran",
    "hellfire jahannam punishment Islam",
    "Shahada declaration of faith Islam",
    # Worship & practice
    "Islamic prayer salah namaz how to pray",
    "fasting Ramadan sawm Islam",
    "Hajj pilgrimage to Mecca Kaaba",
    "Zakat charity obligatory giving Islam",
    "wudu ablution ritual purification Islam",
    "dua supplication asking Allah",
    "dhikr remembrance of Allah glorification",
    "Friday Jumu'ah prayer congregation Islam",
    "Eid ul Fitr Eid ul Adha Islamic celebration",
    # Quran
    "Quran surah verse ayah recitation meaning",
    "revelation of the Quran to prophet Muhammad",
    "interpretation tafsir of Quranic verses",
    "memorization of the Quran hafiz",
    "Quran guidance for mankind",
    "Surah Al-Fatiha opening chapter Quran",
    "Surah Al-Baqarah longest chapter Quran",
    # Hadith & Sunnah
    "hadith prophetic tradition saying of prophet",
    "sunnah of prophet Muhammad peace be upon him",
    "Sahih Bukhari Muslim authentic hadith collection",
    "companions narrated the prophet said",
    "forty hadith Nawawi Islamic traditions",
    # Islamic law & ethics
    "halal food permissible in Islam",
    "haram forbidden prohibited in Islam",
    "Islamic fiqh jurisprudence ruling",
    "fatwa Islamic legal opinion",
    "sharia Islamic law",
    "Islamic manners etiquette adab",
    "good character akhlaq Islam",
    # Islamic history & biography
    "life of prophet Muhammad seerah biography",
    "Islamic caliphate history rightly guided caliphs",
    "companions sahaba of prophet Islam",
    "Islamic civilization golden age",
    "migration Hijra of prophet from Mecca to Medina",
    "Battle of Badr Uhud Islamic history",
    # Ethics & virtues
    "rights of neighbors in Islam",
    "honesty truthfulness Islam trust",
    "patience sabr in the Quran Islam",
    "gratitude shukr to Allah Islam",
    "forgiveness tawbah repentance Islam",
    "kindness mercy compassion Islam",
    "justice fairness equality Islam",
    # Family & society
    "marriage nikah Islamic wedding contract",
    "rights of parents mother father in Islam",
    "raising children Islamic upbringing",
    "divorce talaq Islamic rules",
    "Islamic community ummah brotherhood",
    "mosque masjid worship congregational prayer",
    # Islamic finance & lifestyle
    "riba interest usury Islamic prohibition",
    "Islamic finance halal investment",
    "modesty hijab dress code Islam",
]

# ---------------------------------------------------------------------------
# Fast-reject keyword sets — obvious non-Islamic queries bypassed immediately
# ---------------------------------------------------------------------------
NON_ISLAMIC_KEYWORDS: set[str] = {
    # Programming / tech
    "python", "javascript", "typescript", "java", "c++", "golang", "rust", "swift",
    "coding", "programming", "algorithm", "function", "variable", "loop",
    "debug", "software", "api", "database query", "machine learning", "neural network",
    "tensorflow", "pytorch", "linux", "windows command", "git commit",
    # Weather
    "weather", "temperature today", "forecast", "raining", "humidity",
    # Entertainment
    "movie", "film", "actor", "actress", "netflix", "youtube video", "song lyrics",
    "game", "gaming", "playstation", "xbox", "fortnite",
    "music band", "singer", "album", "concert ticket",
    # Sports
    "cricket score", "football result", "nba", "ipl", "match result",
    "team won", "sports news",
    # Finance (non-Islamic)
    "bitcoin price", "cryptocurrency", "stock market today", "forex trading",
    # Social media / lifestyle
    "instagram", "twitter", "facebook", "tiktok", "reddit",
    "meme", "viral trend",
    # Food reviews (not halal questions)
    "restaurant review", "recipe for pizza", "best burger",
    # Generic off-topic
    "tell me a joke", "write me a poem about", "write a story about",
    "homework help", "essay writing", "translate this to spanish",
}

# Words that appear in non-Islamic contexts but are actually Islamic questions
ISLAMIC_OVERRIDE_KEYWORDS: set[str] = {
    "allah", "quran", "hadith", "prophet", "sunnah", "islam", "islamic",
    "muslim", "salah", "zakat", "hajj", "ramadan", "fasting", "prayer",
    "halal", "haram", "surah", "ayah", "imam", "mosque", "masjid",
    "hijab", "wudu", "eid", "ummah", "shahada", "tawheed", "iman",
    "jannah", "jahannam", "tawbah", "dua", "dhikr", "bismillah",
    "alhamdulillah", "subhanallah", "inshallah", "mashallah",
}

# ---------------------------------------------------------------------------
# Threshold — minimum cosine similarity to Islamic anchors for acceptance
# ---------------------------------------------------------------------------
TOPIC_THRESHOLD: float = 0.30

# ---------------------------------------------------------------------------
# Rejection message shown to the user for off-topic queries
# ---------------------------------------------------------------------------
REJECTION_MESSAGE: str = (
    "I'm an Islamic knowledge assistant and I'm only able to answer questions about "
    "Islam, the Quran, Hadith, Islamic history, fiqh, and related topics. "
    "Your question appears to be outside my knowledge domain. "
    "Please ask something related to Islamic faith and practice. 🌙"
)


def check_query(
    query: str,
    anchor_embeddings: np.ndarray,
    embedding_model,
    threshold: float = TOPIC_THRESHOLD,
) -> Tuple[bool, float]:
    """
    Determines whether a query is Islamic in nature.

    Args:
        query:             The user's input query string.
        anchor_embeddings: Pre-computed numpy array of shape (N, dim) with normalized
                           Islamic anchor phrase embeddings.
        embedding_model:   Loaded SentenceTransformer instance.
        threshold:         Cosine similarity threshold [0, 1].

    Returns:
        (is_islamic: bool, confidence_score: float)
    """
    query_lower = query.lower().strip()

    # 1. Override: if query contains explicit Islamic keywords, always accept
    if any(kw in query_lower for kw in ISLAMIC_OVERRIDE_KEYWORDS):
        return True, 1.0

    # 2. Fast-reject: keyword check for obvious non-Islamic content
    if any(kw in query_lower for kw in NON_ISLAMIC_KEYWORDS):
        return False, 0.0

    # 3. Too short queries (< 3 words) are ambiguous — reject
    if len(query_lower.split()) < 3:
        return False, 0.0

    # 4. Semantic similarity check via cosine similarity
    query_vec = embedding_model.encode(
        [query],
        normalize_embeddings=True,
        show_progress_bar=False,
        batch_size=1,
    )  # shape: (1, dim)

    # Dot product of normalized vectors = cosine similarity
    similarities = np.dot(query_vec, anchor_embeddings.T)[0]  # shape: (N,)
    max_score = float(np.max(similarities))

    return max_score >= threshold, max_score
