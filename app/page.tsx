"use client";

// ...existing code...

// 추천 알고리즘: 각 장소의 후기 신뢰도와 평점 평균을 계산하여 상위 2개 추천
type ScoredPlace = Place & { avgTrust: number; avgRating: number; score: number };

function getRecommendedPlaces(reviews: Record<number, Review[]>, places: Place[]): ScoredPlace[] {
  // 각 장소별 신뢰도 평균과 평점 평균 계산
  const scored: ScoredPlace[] = places.map(place => {
    const placeReviews = reviews[place.id] || [];
    const avgTrust = placeReviews.length > 0 ? placeReviews.reduce((sum, r) => sum + r.trustScore, 0) / placeReviews.length : 0;
    const avgRating = placeReviews.length > 0 ? placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length : 0;
    return {
      ...place,
      avgTrust,
      avgRating,
      score: avgTrust * 0.7 + avgRating * 20 * 0.3, // 신뢰도 70%, 평점 30% 가중치
    };
  });
  // 점수 기준 상위 2개 추천
  return scored.sort((a, b) => b.score - a.score).slice(0, 2);
}

import Image from "next/image";

// 장소 데이터 모델
interface Place {
  id: number;
  name: string;
  category: string;
  location: string;
  description: string;
  reviews: Review[];
}

// 후기 데이터 모델
interface Review {
  id: number;
  user: string;
  rating: number;
  text: string;
  photoUrl: string;
  trustScore: number; // 신뢰도 점수
}

// 샘플 데이터
const samplePlaces: Place[] = [
  {
    id: 1,
    name: "숨은카페",
    category: "카페",
    location: "서울 강남구",
    description: "조용하고 분위기 좋은 숨은 카페",
    reviews: [
      {
        id: 1,
        user: "userA",
        rating: 5,
        text: "직접 가보니 정말 조용하고 커피가 맛있어요!",
        photoUrl: "/file.svg",
        trustScore: 95,
      },
      {
        id: 2,
        user: "userB",
        rating: 4,
        text: "광고와 다르게 진짜 분위기가 좋아요.",
        photoUrl: "/globe.svg",
        trustScore: 90,
      },
    ],
  },
  {
    id: 2,
    name: "골목식당",
    category: "식당",
    location: "서울 마포구",
    description: "현지인 추천 골목식당",
    reviews: [
      {
        id: 3,
        user: "userC",
        rating: 5,
        text: "SNS에서 본 것보다 훨씬 맛있고 친절해요.",
        photoUrl: "/window.svg",
        trustScore: 92,
      },
    ],
  },
];

import React, { useState } from "react";
// ...existing code...

export default function Page() {
  // 후기 작성 폼 상태
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>(samplePlaces[0].id);
  const [user, setUser] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<number, Review[]>>(() => {
    const initial: Record<number, Review[]> = {};
    samplePlaces.forEach(place => {
      initial[place.id] = place.reviews;
    });
    return initial;
  });

  // 후기 추가 핸들러
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError("닉네임을 입력하세요.");
      return;
    }
    if (!text) {
      setError("후기 내용을 입력하세요.");
      return;
    }
    if (!photoUrl) {
      setError("사진 파일명을 입력하세요.");
      return;
    }

    const newReview: Review = {
      id: Date.now(),
      user,
      rating,
      text,
      photoUrl,
      trustScore: 90, // 기본값
    };

    setReviews((prev: Record<number, Review[]>) => {
      const updated = { ...prev };
      updated[selectedPlaceId] = [...(updated[selectedPlaceId] || []), newReview];

      // 간단한 신뢰도 재계산: 각 리뷰의 텍스트 길이와 기존 신뢰도를 반영
      const recalc = updated[selectedPlaceId].map(r => r.trustScore);
      const avgTrust = recalc.reduce((s, v) => s + v, 0) / recalc.length;
      // 각 리뷰의 trustScore를 평균으로 보정(간단화)
      updated[selectedPlaceId] = updated[selectedPlaceId].map(r => ({ ...r, trustScore: Math.round(avgTrust) }));

      return updated;
    });

    setUser("");
    setRating(5);
    setText("");
    setPhotoUrl("");
  };

  // 추천 장소 계산
  const recommended = getRecommendedPlaces(reviews, samplePlaces);

  return (
    <main className="min-h-screen bg-sky-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-4xl">
        {/* 상단 헤더 (그라데이션 스타일) */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full p-2 bg-gradient-to-tr from-sky-400 to-sky-600 shadow-md">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">PR</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-sky-800 tracking-tight">장소 추천</div>
              <div className="text-sm text-sky-600">현실 후기 기반, 취향 맞춤</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input placeholder="지역/키워드 검색" className="hidden sm:inline-block w-64 px-4 py-2 rounded-full border border-sky-100 bg-white shadow-sm focus:outline-none" />
              <button className="ml-2 bg-white text-sky-600 px-3 py-2 rounded-full shadow-sm">로그인</button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-medium mb-3">오늘의 추천</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommended.map(place => (
                  <article key={place.id} className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-white to-sky-50 border border-sky-100 hover:translate-y-[-4px] transition-transform">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 font-bold text-lg">{place.name.charAt(0)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-sky-800">{place.name}</h3>
                            <p className="text-xs text-sky-500">{place.category} • {place.location}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-sky-700">{place.avgRating.toFixed(1)} ★</div>
                            <div className="text-xs text-sky-400">신뢰도 {place.avgTrust.toFixed(0)}</div>
                          </div>
                        </div>
                        <p className="text-sm text-sky-600 mt-2">{place.description}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">#숨은맛집</span>
                          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">#조용한카페</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute right-3 bottom-3">
                      <button className="bg-sky-600 text-white px-3 py-1 rounded-full text-sm">자세히 보기</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-medium mb-3">근처 핫플</h2>
              <div className="grid grid-cols-1 gap-3">
                {samplePlaces.map((place) => (
                  <div key={place.id} className="p-3 rounded-xl border border-sky-50 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-sky-100 flex items-center justify-center">
                      <img src={place.reviews[0]?.photoUrl || '/file.svg'} alt={`${place.name} 대표 이미지`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-sky-800">{place.name}</h3>
                          <p className="text-xs text-sky-500">{place.category}</p>
                        </div>
                        <div className="text-sm text-sky-500">{(reviews[place.id] || []).length} 후기</div>
                      </div>
                      <p className="text-sm text-sky-600 mt-1">{place.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-medium mb-3">후기 작성</h2>
              <form onSubmit={handleAddReview} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold">U</div>
                  <div className="flex-1">
                    <input type="text" placeholder="닉네임" value={user} onChange={e => setUser(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>

                <label className="block text-sm text-sky-600">장소</label>
                <select value={selectedPlaceId} onChange={e => setSelectedPlaceId(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2">
                  {samplePlaces.map(place => (
                    <option key={place.id} value={place.id}>{place.name}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input type="number" min={1} max={5} placeholder="평점" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-20 border rounded-lg px-3 py-2" />
                  <input type="text" placeholder="사진 파일명 (예: file.svg)" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" />
                </div>

                <textarea placeholder="후기 내용을 작성해 주세요" value={text} onChange={e => setText(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={4} />

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-full py-2 shadow">등록</button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
