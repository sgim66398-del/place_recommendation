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
    <main className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">장소 추천</h1>
          <p className="text-sm text-gray-500">솔직한 후기 기반의 간단한 추천</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-3">추천 장소</h2>
              <div className="space-y-4">
                {recommended.map(place => (
                  <div key={place.id} className="p-3 border rounded-md hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{place.name}</h3>
                        <p className="text-xs text-gray-500">{place.category} • {place.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{place.avgRating.toFixed(1)} ★</div>
                        <div className="text-xs text-gray-400">신뢰도 {place.avgTrust.toFixed(0)}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{place.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-3">장소 목록</h2>
              <div className="space-y-4">
                {samplePlaces.map((place) => (
                  <div key={place.id} className="p-3 border rounded-md">
                    <div className="flex items-start gap-4">
                      <img src={place.reviews[0]?.photoUrl || '/file.svg'} alt={`${place.name} 대표 이미지`} className="w-16 h-16 rounded object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{place.name}</h3>
                          <div className="text-sm text-gray-500">{(reviews[place.id] || []).length} 후기</div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{place.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-3">후기 작성</h2>
              <form onSubmit={handleAddReview} className="space-y-3">
                <label className="block text-sm text-gray-600">장소</label>
                <select value={selectedPlaceId} onChange={e => setSelectedPlaceId(Number(e.target.value))} className="w-full border rounded px-2 py-1">
                  {samplePlaces.map(place => (
                    <option key={place.id} value={place.id}>{place.name}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input type="text" placeholder="닉네임" value={user} onChange={e => setUser(e.target.value)} className="flex-1 border rounded px-2 py-1" />
                  <input type="number" min={1} max={5} placeholder="평점" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-20 border rounded px-2 py-1" />
                </div>

                <input type="text" placeholder="사진 파일명 (예: file.svg)" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="w-full border rounded px-2 py-1" />

                <textarea placeholder="후기 내용을 작성해 주세요" value={text} onChange={e => setText(e.target.value)} className="w-full border rounded px-2 py-1" rows={4} />

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <button type="submit" className="w-full bg-blue-600 text-white rounded py-2">등록</button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
