import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import "./App.css";

export default function App() {
  const [search, setSearch] = useState("");
  const [alarmData, setAlarmData] = useState({});
  const [componentAlarms, setComponentAlarms] = useState({});
  const [equipmentStructure, setEquipmentStructure] = useState({});
  
  const [selectedAlarm, setSelectedAlarm] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [error, setError] = useState("");

  const equipmentRefs = useRef({});
  const alarmListRef = useRef(null);
  const detailPaneRef = useRef(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const getCategory = (component) => {
  const name = component.toLowerCase();

  if (name.includes("보호 유리")) return "광학계";
  if (name.includes("프로세스 파이버")) return "광학계";
  if (name.includes("피딩 파이버")) return "광학계";
  if (name.includes("옵틱 헤드")) return "광학계";
  if (name.includes("coupler")) return "광학계";

  if (name.includes("프레셔 피스")) return "UPPs";
  if (name.includes("샤프트")) return "UPPs";

  if (name.includes("석션 파이프")) return "호스 및 밸브";
  if (name.includes("에어 시스템")) return "호스 및 밸브";
  if (name.includes("냉각 호스")) return "호스 및 밸브";
  if (name.includes("석션 호스")) return "호스 및 밸브";
  if (name.includes("오버젯 밸브")) return "호스 및 밸브";
  if (name.includes("공업용수")) return "호스 및 밸브";
  if (name.includes("에어 차단 밸브")) return "호스 및 밸브";
  if (name.includes("냉각수 밸브")) return "호스 및 밸브";
  if (name.includes("스트레이너")) return "호스 및 밸브";

  if (name.includes("z-drive")) return "구동계";
  if (name.includes("wobble drive")) return "구동계";
  if (name.includes("seam drive")) return "구동계";
  if (name.includes("seam drive 이동경로")) return "구동계";
  if (name.includes("encoder")) return "구동계";
  if (name.includes("타이밍 벨트")) return "구동계";

  if (name.includes("pilz 세이프티 모듈")) return "세이프티";
  if (name.includes("세이프티")) return "세이프티";
  if (name.includes("비상 정지")) return "세이프티";

  if (name.includes("레이저 모듈")) return "레이저 시스템";
  if (name.includes("컴바이너")) return "레이저 시스템";
  if (name.includes("스플라이스 박스")) return "레이저 시스템";
  if (name.includes("파워 서플라이")) return "레이저 시스템";

  if (name.includes("전장부")) return "전장부";
  if (name.includes("mcu")) return "전장부";

  if (name.includes("캐비닛 습도")) return "캐비닛";
  if (name.includes("2x tec")) return "캐비닛";
  
  if (name.includes("센서")) return "센서";

  if (name.includes("케이블")) return "케이블";
  if (name.includes("컨트롤러")) return "컨트롤러";
  if (name.includes("전원")) return "전원";

  return "기타";
  };

    const sortedEquipmentKeys = Object.keys(equipmentStructure).sort((a, b) => {
    if (!selectedAlarm) return 0;
    
    const isASelected = selectedAlarm.equipments.includes(a);
    const isBSelected = selectedAlarm.equipments.includes(b);
    
    if (isASelected && !isBSelected) return -1; // 선택된 장비를 위로 보냄
    if (!isASelected && isBSelected) return 1;
    return 0;
  });
  
  useEffect(() => {
    fetch("/alarm.csv")
      .then((res) => {
        if (!res.ok) throw new Error("CSV 불러오기 실패");
        return res.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const alarmObj = {};
            const compMap = {};
            const equipMap = {};
           
            results.data.forEach((row) => {
              const code = (row.code || row.Code)?.toUpperCase().trim();
              const description = row.description || row.Description || "";
              const message = row.message || row.Message || "";
              const cause = row.cause || row.casue || row.Cause || "";
              const troubleshooting = row.troubleshooting || row.Troubleshooting || "";
              const componentStr = row.component || row.Component || "Laser Module";
              const equipmentStr = row.equipment || row.Equipment || "LSS Control";

              const cleanCode = code?.trim();
      
              if (!cleanCode || !componentStr || !equipmentStr) return;

              const componentList = componentStr
                .split(/[\/,]/)
                .map((c) => c.trim())
                .filter((c) => c !== "");

              const equipmentList = equipmentStr
                .split("/")
                .map((e) => e.trim())
                .filter((e) => e !== "");
               
              if (!alarmObj[cleanCode]) {
                alarmObj[cleanCode] = {
                  code: cleanCode,
                  description,
                  message,
                  cause,
                  troubleshooting,
                  components: [],
                  equipments: [],
                };
              }

              componentList.forEach((comp) => {
                if (!alarmObj[cleanCode].components.includes(comp)) {
                  alarmObj[cleanCode].components.push(comp);
                }
              });

              equipmentList.forEach((eq) => {
                if (!alarmObj[cleanCode].equipments.includes(eq)) {
                  alarmObj[cleanCode].equipments.push(eq);
                }
              });

             equipmentList.forEach((equipment) => {
                // 1. 장비(Equipment)별 컴포넌트 리스트 보장
                if (!equipMap[equipment]) equipMap[equipment] = [];

                componentList.forEach((component) => {
                  // 장비 리스트에 해당 컴포넌트가 없는 경우에만 추가
                  if (!equipMap[equipment].includes(component)) {
                    equipMap[equipment].push(component);
                  }

                  // 2. 컴포넌트(Component)별 알람 리스트 보장 (전역 관리)
                  if (!compMap[component]) compMap[component] = [];
                  if (!compMap[component].includes(cleanCode)) {
                    compMap[component].push(cleanCode);
                  }
                });
              });
            });

            setAlarmData(alarmObj);
            setComponentAlarms(compMap);
            setEquipmentStructure(equipMap);
          },
          error: (err) => {
            console.error(err);
            setError("CSV 파싱 중 오류가 발생했습니다.");
          }
        });
      })
      .catch((err) => {
        console.error(err);
        setError("알람 데이터를 불러오지 못했습니다. CSV 파일 위치를 확인해주세요.");
      });
  }, []);

  const toggleCategory = (eq, cat) => {
  const key = `${eq}-${cat}`;
  setExpandedCategories(prev => ({
    ...prev,
    [key]: !prev[key]
    }));
  };

  const expandCategory = (eq, comp) => {
    const cat = getCategory(comp);
    const key = `${eq}-${cat}`;

    setExpandedCategories(prev => ({
      ...prev,
      [key]: true   // ✅ 해당 category 열기
      }));
    };
  const handleComponentSelect = (comp, eq) => {
    setSelectedAlarm(null);
    setSelectedComponent(comp);
    setSelectedEquipment(eq);

    setTimeout(() => {
      if (window.innerWidth <= 768 && alarmListRef.current) {
        alarmListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const handleAlarmSelect = (alarm, forceEquipment = null) => {
    setSelectedAlarm(alarm);

    if (alarm.equipments && alarm.components) {
    const newExpanded = {};
    alarm.equipments.forEach(eq => {
      alarm.components.forEach(comp => {
        const cat = getCategory(comp);
        newExpanded[`${eq}-${cat}`] = true; // 강제로 펼침 상태로 설정
      });
    });
      setExpandedCategories(newExpanded);
    } 
    let targetEquipment = forceEquipment;

    if (!targetEquipment && alarm.equipments?.length > 0) {
      targetEquipment = alarm.equipments[0];
    }

    if (targetEquipment) {
      setSelectedEquipment(targetEquipment);
    }

    /*setTimeout(() => {
      if (window.innerWidth <= 768 && detailPaneRef.current) {
        detailPaneRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (alarm.equipments?.length > 0) {
        const elements = alarm.equipments
          .map((eq) => equipmentRefs.current[eq])
          .filter(Boolean);

        if (elements.length > 0) {
          const firstElement = elements[0];
          firstElement.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }
    }, 50);*/
  };

  const handleSearch = () => {
    const normalized = search.trim().toUpperCase();
    const alarm = alarmData[normalized];

    if (!alarm) {
      alert(`입력하신 알람 코드 [${normalized}]를 찾을 수 없습니다.`);
      return;
    }

    handleAlarmSelect(alarm);
    if (alarm.components && alarm.components.length > 0) {
      setSelectedComponent(alarm.components[0]);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 style={{ fontSize: "20px", color: "var(--accent-primary)", margin: 0 }}>
          LSS Event Dashboard
        </h1>
        <div className="search-container">
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="알람 코드 검색 (예: 12000)"
          />
          <button className="search-btn" onClick={handleSearch}>검색</button>
        </div>
        <div style={{ justifySelf: "end" }}></div>
      </header>

      {/* Main Content Area */}
      <div className="main-content">
        
        {/* Column 1: Sidebar (Equipment & Components) */}
        <div className="sidebar scrollable">
          {error && <p style={{ color: "var(--color-danger)", fontSize: "14px" }}>{error}</p>}
          
         <div className="equipment-list">
        {sortedEquipmentKeys.map((eq) => {  // 이렇게 바꾸시면 됩니다
          const isEquipmentSelected =
            selectedEquipment === eq ||
            (selectedAlarm && selectedAlarm.equipments?.includes(eq));
          
    // ... 나머지 코드는 그대로 두시면 됩니다.
              return (
                <div
                  key={eq}
                  ref={(el) => (equipmentRefs.current[eq] = el)}
                  className={`equipment-card ${isEquipmentSelected ? "active" : ""}`}
                >
                  <div className="equipment-title">
                    🖥️ {eq} {isEquipmentSelected && "🔥"}
                  </div>
                  
                 <div className="component-grid">
                   {(() => {
                    const groups = {};

                    (equipmentStructure[eq] || []).forEach((comp) => {
                     const cat = getCategory(comp);
                      if (!groups[cat]) groups[cat] = [];
                      groups[cat].push(comp);
                    });

                    return Object.entries(groups).flatMap(([cat, comps]) => {
                      const key = `${eq}-${cat}`;
                      const isOpen = expandedCategories[key];

                      return [
                       // ✅ 카테고리 버튼
                        <button
                          key={`${key}-header`}
                          onClick={() => {
                            setExpandedCategories({});
                            toggleCategory(eq, cat);
                            setSelectedEquipment(eq);
                          }}
                          className={`component-item category-item ${isOpen ? "active" : ""}`}
                          style={{ gridColumn: "1 / -1" }}
                        >
                          {isOpen ? "▼ " : "▶ "} {cat}
                        </button>,

                        // ✅ 펼쳐졌을 때만 컴포넌트 표시
                        ...(isOpen
                          ? comps.map((comp) => {
                            const isHighlighted =
                            (selectedAlarm &&
                              selectedAlarm.equipments?.includes(eq) &&
                              selectedAlarm.components?.includes(comp));

                              return (
                                <button
                                  key={comp}
                                  onClick={() => {
                                    handleComponentSelect(comp, eq);
                                    expandCategory(eq, comp);
                                  }}
                                  className={`component-item ${isHighlighted ? "active" : ""}`}
                                >
                                  • {comp}
                                </button>
                              );
                            })
                          : [])
                        ];
                      });
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Alarm List */}
        <div className="alarm-list-pane scrollable" ref={alarmListRef}>
          <div className="pane-title">🚨 발생 가능 알람</div>
          
          {selectedComponent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {selectedEquipment} &gt; <strong style={{color: "var(--text-main)"}}>{selectedComponent}</strong>
              </div>
              
              <div className="alarm-grid">
              {componentAlarms[selectedComponent]?.map((code) => {
                if (!alarmData[code]?.equipments?.includes(selectedEquipment)) return null;

                const isAlarmActive = selectedAlarm?.code === code;
                
                return (
                  <button
                    key={code}
                    className={`alarm-card ${isAlarmActive ? "active" : ""}`}
                    onClick={() => handleAlarmSelect({ ...alarmData[code], code }, selectedEquipment)}
                  >
                    <div className="alarm-code">{code}</div>
                    <div className="alarm-desc">{alarmData[code]?.message}</div>
                  </button>
                );
              })}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">👈</span>
              <p>좌측에서 부품을 선택하면<br/>알람 목록이 표시됩니다.</p>
            </div>
          )}
        </div>

        {/* Column 3: Detail View */}
        <div className="alarm-detail-pane scrollable" ref={detailPaneRef}>
          {selectedAlarm ? (
            <div className="detail-card">
              <div className="detail-header">
                <div className="detail-code">{selectedAlarm.code}</div>
                <div className="detail-breadcrumbs">
                  {selectedAlarm.equipments?.join(", ")} &gt; {selectedAlarm.components?.join(", ")}
                </div>
              </div>
              
              <div className="detail-section">
                <div className="detail-section-title">Description</div>
                <div className="detail-content">{selectedAlarm.description}</div>
              </div>
              
              <div className="detail-section">
                <div className="detail-section-title">Message</div>
                <code style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", color: "var(--text-main)", fontSize: "14px" }}>
                  {selectedAlarm.message}
                </code>
              </div>

              <div className="detail-section">
                <div className="detail-section-title" style={{ color: "var(--color-danger)" }}>🚨 발생 원인 (Cause)</div>
                <div className="detail-content">{selectedAlarm.cause}</div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title" style={{ color: "var(--color-success)" }}>🛠️ 트러블슈팅 매뉴얼 (Troubleshooting)</div>
                <div className="detail-content">{selectedAlarm.troubleshooting}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">💡</span>
              <p>알람 코드를 선택하면<br/>상세 가이드라인이 이곳에 표시됩니다.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}