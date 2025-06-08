import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function App() {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ startTime: '', endTime: '', note: '' })
  const [editingId, setEditingId] = useState(null)

  const toLocalDatetimeInput = isoString => {
    if (!isoString) return ''
    const dt = new Date(isoString)
    const year = dt.getFullYear()
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    const day = String(dt.getDate()).padStart(2, '0')
    const hour = String(dt.getHours()).padStart(2, '0')
    const minute = String(dt.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  const toISOStringWithoutSeconds = dtStr => {
    if (!dtStr) return ''
    const dt = new Date(dtStr)
    dt.setSeconds(0, 0)
    return dt.toISOString()
  }

  const fetchRecords = async () => {
    const res = await fetch('http://localhost:3001/records')
    const data = await res.json()
    setRecords(data)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const onChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const onSubmit = async e => {
    e.preventDefault()

    if (form.endTime <= form.startTime) {
      alert('기상 시간은 수면 시작 시간보다 늦어야 합니다.')
      return
    }

    const payload = {
      ...form,
      startTime: toISOStringWithoutSeconds(form.startTime),
      endTime: toISOStringWithoutSeconds(form.endTime)
    }

    if (editingId) {
      await fetch(`http://localhost:3001/records/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      alert('수정 완료되었습니다.')
      setEditingId(null)
    } else {
      await fetch('http://localhost:3001/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }
    setForm({ startTime: '', endTime: '', note: '' })
    fetchRecords()
  }

  const onDelete = async id => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await fetch(`http://localhost:3001/records/${id}`, { method: 'DELETE' })
      fetchRecords()
    }
  }

  const onEdit = record => {
    setEditingId(record.id)
    setForm({
      startTime: toLocalDatetimeInput(record.startTime),
      endTime: toLocalDatetimeInput(record.endTime),
      note: record.note || ''
    })
  }

  const onCancelEdit = () => {
    setEditingId(null)
    setForm({ startTime: '', endTime: '', note: '' })
  }

  const calculateSleepDuration = (start, end) => {
    const startTime = new Date(start)
    const endTime = new Date(end)
    const diffMs = endTime - startTime
    const totalMinutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}시간 ${minutes}분`
  }

  const styles = {
    container: {
      maxWidth: 600,
      margin: '40px auto',
      padding: 20,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    title: {
      textAlign: 'center',
      color: '#333',
      marginBottom: 30,
      fontWeight: '700'
    },
    form: {
      marginBottom: 30,
      display: 'flex',
      flexDirection: 'column',
      gap: 15
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      marginBottom: 6,
      fontWeight: '600',
      color: '#555'
    },
    input: {
      padding: '8px 12px',
      borderRadius: 4,
      border: '1.5px solid #ccc',
      fontSize: 14,
      transition: 'border-color 0.2s'
    },
    buttonGroup: {
      display: 'flex',
      gap: 10,
      marginTop: 10
    },
    button: {
      padding: '10px 18px',
      borderRadius: 5,
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: 15,
      transition: 'background-color 0.3s',
      flex: 1
    },
    addButton: {
      backgroundColor: '#4a90e2',
      color: 'white'
    },
    cancelButton: {
      backgroundColor: '#aaa',
      color: 'white'
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 15
    },
    listItem: {
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column'
    },
    recordRow: {
      marginBottom: 6,
      color: '#444',
      fontSize: 14
    },
    buttonsRow: {
      marginTop: 10,
      display: 'flex',
      gap: 10
    },
    editButton: {
      backgroundColor: '#f0ad4e',
      border: 'none',
      padding: '8px 14px',
      borderRadius: 5,
      cursor: 'pointer',
      color: 'white',
      fontWeight: '600',
      transition: 'background-color 0.3s',
      flex: 1
    },
    deleteButton: {
      backgroundColor: '#d9534f',
      border: 'none',
      padding: '8px 14px',
      borderRadius: 5,
      cursor: 'pointer',
      color: 'white',
      fontWeight: '600',
      flex: 1,
      transition: 'background-color 0.3s'
    }
  }

  // 일별 총 수면 시간 계산 함수
  const getChartData = () => {
    const dateMap = {}

    records.forEach(({ startTime, endTime }) => {
      const date = new Date(startTime).toLocaleDateString()
      const start = new Date(startTime)
      const end = new Date(endTime)
      const hours = (end - start) / 3600000

      dateMap[date] = (dateMap[date] || 0) + hours
    })

    const labels = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b))
    const data = labels.map(label => Number(dateMap[label].toFixed(2)))

    return {
      labels,
      datasets: [
        {
          label: '일별 총 수면 시간(시간)',
          data,
          backgroundColor: 'rgba(74, 144, 226, 0.7)'
        }
      ]
    }
  }

  // 일별 평균 수면 시간 계산 함수 (기록 개수로 나눔)
  const getAverageChartData = () => {
    const dateMap = {}
    const countMap = {}

    records.forEach(({ startTime, endTime }) => {
      const date = new Date(startTime).toLocaleDateString()
      const start = new Date(startTime)
      const end = new Date(endTime)
      const hours = (end - start) / 3600000

      dateMap[date] = (dateMap[date] || 0) + hours
      countMap[date] = (countMap[date] || 0) + 1
    })

    const labels = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b))
    const data = labels.map(label => Number((dateMap[label] / countMap[label]).toFixed(2)))

    return {
      labels,
      datasets: [
        {
          label: '일별 평균 수면 시간(시간)',
          data,
          backgroundColor: 'rgba(246, 126, 33, 0.7)'
        }
      ]
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>수면 시간 기록</h1>

      <form onSubmit={onSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="startTime" style={styles.label}>
            수면 시작 시간
          </label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            style={styles.input}
            value={form.startTime}
            onChange={onChange}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="endTime" style={styles.label}>
            기상 시간
          </label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            style={styles.input}
            value={form.endTime}
            onChange={onChange}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="note" style={styles.label}>
            메모
          </label>
          <input
            type="text"
            id="note"
            name="note"
            style={styles.input}
            value={form.note}
            onChange={onChange}
            placeholder="간단한 메모"
          />
        </div>

        <div style={styles.buttonGroup}>
          <button type="submit" style={{ ...styles.button, ...styles.addButton }}>
            {editingId ? '수정하기' : '기록하기'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={onCancelEdit}
              style={{ ...styles.button, ...styles.cancelButton }}
            >
              취소
            </button>
          )}
        </div>
      </form>

      <ul style={styles.list}>
        {records.map(record => (
          <li key={record.id} style={styles.listItem}>
            <div style={styles.recordRow}>
              <strong>수면 시작:</strong> {new Date(record.startTime).toLocaleString()}
            </div>
            <div style={styles.recordRow}>
              <strong>기상 시간:</strong> {new Date(record.endTime).toLocaleString()}
            </div>
            <div style={styles.recordRow}>
              <strong>수면 시간:</strong> {calculateSleepDuration(record.startTime, record.endTime)}
            </div>
            <div style={styles.recordRow}>
              <strong>메모:</strong> {record.note || '-'}
            </div>
            <div style={styles.buttonsRow}>
              <button onClick={() => onEdit(record)} style={styles.editButton} type="button">
                수정
              </button>
              <button onClick={() => onDelete(record.id)} style={styles.deleteButton} type="button">
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      {records.length > 0 && (
        <>
          <h2 style={{ marginTop: 40, color: '#444' }}>일별 총 수면 시간</h2>
          <Bar data={getChartData()} />

          <h2 style={{ marginTop: 40, color: '#444' }}>일별 평균 수면 시간</h2>
          <Bar data={getAverageChartData()} />
        </>
      )}
    </div>
  )
}
