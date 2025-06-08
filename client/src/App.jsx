import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function App() {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ startTime: '', endTime: '', note: '' })
  const [editingId, setEditingId] = useState(null)

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

  const addSeconds = dtStr => {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dtStr)) {
      return dtStr + ':00'
    }
    return dtStr
  }

  const onSubmit = async e => {
    e.preventDefault()

    if (form.endTime <= form.startTime) {
      alert('기상 시간은 수면 시작 시간보다 늦어야 합니다.')
      return
    }

    const payload = {
      ...form,
      startTime: addSeconds(form.startTime),
      endTime: addSeconds(form.endTime)
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
      startTime: record.startTime.slice(0, 16),
      endTime: record.endTime.slice(0, 16),
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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💤 Deep Sleep</h1>

      <form onSubmit={onSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>수면 시작 시간:</label>
          <input
            type="datetime-local"
            name="startTime"
            value={form.startTime}
            onChange={onChange}
            required
            style={styles.input}
            onFocus={e => (e.target.style.borderColor = '#4a90e2')}
            onBlur={e => (e.target.style.borderColor = '#ccc')}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>기상 시간:</label>
          <input
            type="datetime-local"
            name="endTime"
            value={form.endTime}
            onChange={onChange}
            required
            style={styles.input}
            onFocus={e => (e.target.style.borderColor = '#4a90e2')}
            onBlur={e => (e.target.style.borderColor = '#ccc')}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>특이사항:</label>
          <input
            type="text"
            name="note"
            value={form.note}
            onChange={onChange}
            placeholder="예: 악몽, 코골이 등"
            style={styles.input}
          />
        </div>

        <div style={styles.buttonGroup}>
          <button type="submit" style={{ ...styles.button, ...styles.addButton }}>
            {editingId ? '수정 완료' : '기록 추가'}
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

      {/* 통계 차트 영역 */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#333', marginBottom: 20 }}>수면 통계</h2>
        <Bar data={getChartData()} />
      </div>

      <ul style={styles.list}>
        {records.map(r => (
          <li key={r.id} style={styles.listItem}>
            <div style={styles.recordRow}>
              <strong>수면 시작:</strong> {new Date(r.startTime).toLocaleString()}
            </div>
            <div style={styles.recordRow}>
              <strong>기상 시간:</strong> {new Date(r.endTime).toLocaleString()}
            </div>
            <div style={styles.recordRow}>
              <strong>수면 시간:</strong> {calculateSleepDuration(r.startTime, r.endTime)}
            </div>
            <div style={styles.recordRow}>
              <strong>특이사항:</strong> {r.note || '-'}
            </div>
            <div style={styles.buttonsRow}>
              <button
                onClick={() => onEdit(r)}
                style={styles.editButton}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = '#ec971f')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = '#f0ad4e')}
              >
                수정
              </button>
              <button
                onClick={() => onDelete(r.id)}
                style={styles.deleteButton}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = '#c9302c')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = '#d9534f')}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
